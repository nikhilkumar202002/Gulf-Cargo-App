import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// Using legacy import to handle moveAsync/copyAsync deprecation in newer Expo SDKs
import * as FileSystem from 'expo-file-system/legacy';
import { getCargoDetails } from './cargoService';
import { getBranchDetails } from './coreServices';
import { getPartyDetails } from './partiesServices';

// --- HELPERS ---
const fmtMoney = (amount) => {
  return Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatDate = (dateString) => {
  if (!dateString) return new Date().toLocaleDateString("en-GB");
  return new Date(dateString).toLocaleDateString("en-GB");
};

// --- 1. DATA FETCHING ---
const fetchInvoiceData = async (input) => {
  console.log("--- START INVOICE DATA FETCH ---");

  let branchData = {};
  let cargoData = {};
  let senderData = {};
  let receiverData = {};

  try {
    // ------------------------------------------
    // STEP 1: FETCH CARGO (Single View)
    // ------------------------------------------
    let cargoId = typeof input === 'object' ? input.id : input;
    if (!cargoId) throw new Error("No Cargo ID provided");

    console.log(`Fetching Cargo Details for ID: ${cargoId}`);
    const cargoRes = await getCargoDetails(cargoId);
    
    cargoData = cargoRes.data.data || cargoRes.data.cargo || cargoRes.data || {};
    
    if (!cargoData.id && cargoRes.data && cargoRes.data.id) {
        cargoData = cargoRes.data;
    }

    if (!cargoData || !cargoData.id) {
        throw new Error("Cargo not found in API response.");
    }

    // ------------------------------------------
    // STEP 2: FETCH BRANCH
    // ------------------------------------------
    const branchId = cargoData.branch_id || (cargoData.branch && cargoData.branch.id);

    if (branchId) {
        try {
            const branchRes = await getBranchDetails(branchId);
            branchData = branchRes.data.branch || branchRes.data.data || {};
        } catch (e) {
            console.warn(`Failed to fetch branch details for ID ${branchId}`, e);
        }
    }

    // ------------------------------------------
    // STEP 3: FETCH PARTIES & NORMALIZE FIELDS
    // ------------------------------------------
    const normalizeParty = (p) => {
      if (!p) return {};
      // Ensure we extract all specific location fields for the layout
      return {
        name: p.name || '',
        address: p.address || '',
        phone: p.phone || p.contact_number || p.mobile || p.whatsapp_number || '', 
        post: p.post || '',
        pin: p.pin || p.postal_code || '', 
        // Extract individual fields for the grid layout
        city: p.city || '',
        district: p.district || '',
        state: p.state || '',
        country: p.country || 'India', // Defaulting to India if missing, based on context
        document_id: p.document_id || ''
      };
    };

    // A. Sender
    if (cargoData.sender_id) {
      try {
        const senderRes = await getPartyDetails(cargoData.sender_id);
        const rawSender = senderRes.data.data || senderRes.data;
        senderData = normalizeParty(rawSender);
      } catch (e) {
        senderData = normalizeParty(cargoData.sender); 
      }
    } else {
       senderData = normalizeParty(cargoData.sender);
    }

    // B. Receiver
    if (cargoData.receiver_id) {
      try {
        const receiverRes = await getPartyDetails(cargoData.receiver_id);
        const rawReceiver = receiverRes.data.data || receiverRes.data;
        receiverData = normalizeParty(rawReceiver);
      } catch (e) {
        receiverData = normalizeParty(cargoData.receiver);
      }
    } else {
      receiverData = normalizeParty(cargoData.receiver);
    }

    // ------------------------------------------
    // STEP 4: ASSEMBLE DATA
    // ------------------------------------------
    let boxes = [];
    const rawBoxes = cargoData.boxes;

    if (Array.isArray(rawBoxes)) {
        boxes = rawBoxes;
    } else if (typeof rawBoxes === 'string') {
        try {
            const parsed = JSON.parse(rawBoxes);
            if (Array.isArray(parsed)) boxes = parsed;
            else if (typeof parsed === 'object' && parsed !== null) boxes = Object.values(parsed);
        } catch (e) {
            boxes = [];
        }
    } else if (typeof rawBoxes === 'object' && rawBoxes !== null) {
        boxes = Object.values(rawBoxes);
    }

    boxes = boxes.map(box => ({
        ...box,
        items: Array.isArray(box.items) ? box.items : (
            typeof box.items === 'object' && box.items !== null ? Object.values(box.items) : []
        )
    }));

    const finalData = {
      ...cargoData,
      sender: senderData,
      receiver: receiverData,
      branch_name: branchData.branch_name || cargoData.branch_name || 'GULF CARGO',
      branch_name_ar: branchData.branch_name_ar || 'جلف كارغو',
      branch_address: branchData.branch_address || 'KINGDOM OF SAUDI ARABIA',
      branch_contact: branchData.branch_contact_number || branchData.branch_alternative_number || '',
      branch_logo: branchData.logo_url || null,
      boxes: boxes 
    };

    console.log(`--- INVOICE DATA READY [Boxes: ${boxes.length}] ---`);
    return finalData;

  } catch (error) {
    console.error("Critical Error generating invoice data:", error);
    throw error;
  }
};

// --- 2. HTML GENERATOR ---
const createInvoiceHTML = (data) => {
  const safeBoxes = Array.isArray(data.boxes) ? data.boxes : [];

  const boxRows = safeBoxes.map((box, index) => ({
    boxNo: `B${index + 1}`,
    weight: parseFloat(box.weight || 0).toFixed(3)
  }));

  const totalWeight = safeBoxes.reduce((sum, box) => sum + (parseFloat(box.weight) || 0), 0);

  const structuredItems = [];
  safeBoxes.forEach((box, index) => {
    const boxLabel = `Box ${index + 1}`;
    structuredItems.push({ isHeader: true, title: boxLabel });

    const safeItems = Array.isArray(box.items) ? box.items : [];
    
    if (safeItems.length > 0) {
      safeItems.forEach((item, itemIdx) => {
        structuredItems.push({
          isHeader: false,
          idx: structuredItems.length + 1, 
          name: item.name,
          qty: item.qty || item.piece_no,
          weight: parseFloat(item.weight || 0).toFixed(3)
        });
      });
    }
  });

  const LEFT_ROWS_LIMIT = 25;
  const RIGHT_ROWS_LIMIT = 20;
  const leftRows = [];
  const rightRows = [];
  let currentList = leftRows;
  let currentItemCount = 0;

  structuredItems.forEach((row) => {
    if (row.isHeader) {
      currentList.push(row);
    } else {
      if (currentList === leftRows && currentItemCount >= LEFT_ROWS_LIMIT) {
        currentList = rightRows;
        currentItemCount = 0;
        const last = leftRows[leftRows.length - 1];
        if (last && last.isHeader) rightRows.push(leftRows.pop());
      }
      if (currentList === rightRows && currentItemCount >= RIGHT_ROWS_LIMIT) return;
      currentList.push(row);
      currentItemCount++;
    }
  });

  const leftFillers = Array.from({ length: Math.max(0, LEFT_ROWS_LIMIT - leftRows.filter(r => !r.isHeader).length) });
  const rightFillers = Array.from({ length: Math.max(0, RIGHT_ROWS_LIMIT - rightRows.filter(r => !r.isHeader).length) });

  const bookingNo = data.booking_no || data.invoice_no || `${data.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `https://gulfcargoksa.com/Orderdetails/shipment/?invoice=${data.id}`
  )}`;

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { size: A4; margin: 0; }
          
          :root { 
            --primary-color: #262262; 
            --secondary-color: #ED2624; 
            --text-color: #1e1e1e; 
            --border-color: #1f2937; 
          }
          
          body { 
            font-family: 'Helvetica', sans-serif; 
            font-size: 11px; /* Increased base font size */
            color: #000; 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact;
            background-color: #fff;
          }

          .invoice-sheet { 
            width: 210mm; 
            height: 297mm; 
            margin: 0 auto; 
            padding: 6mm 8mm; 
            box-sizing: border-box; 
            overflow: hidden; 
            display: flex;
            flex-direction: column;
          }
          
          /* HEADER */
          .header-grid { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; height: 110px; }
          .header-left { width: 35%; }
          .header-center { width: 30%; text-align: center; }
          .header-right { width: 35%; text-align: right; }
          
          .logo-img { width: 90px; height:auto object-fit: contain; }
          .qr-img { height: 85px; width: 85px; margin: 0 auto; }
          
          .branch-name { font-size: 18px; font-weight: 700; color: var(--secondary-color); text-transform: uppercase; }
          .branch-name-ar { font-size: 20px; font-weight: 600; color: var(--primary-color); }
          .branch-contact { font-size: 13px; font-weight: 600; color: #333; margin-top: 2px; }
          .branch-address { font-size: 12px; font-weight: 700; color: var(--primary-color); text-transform: uppercase; margin-top: 4px; line-height: 1.2; }

          /* INFO BAR */
          .info-bar { display: flex; background-color: var(--secondary-color); color: white; padding: 4px 8px; border-radius: 4px; margin-bottom: 10px; align-items: center; height: 38px; }
          .info-col { flex: 1; }
          .info-label { font-size: 11px; font-weight: 600; }
          .info-title { font-size: 14px; font-weight: 700; text-align: center; line-height: 1.1; }
          .info-track { text-align: right; }
          .track-pill { background-color: #000; color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; margin-left: 5px; }

          /* MAIN GRID */
          .main-grid { display: flex; gap: 10px; margin-bottom: 10px; height: 165px; }
          .col-party { flex: 2; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column; }
          .col-summary { flex: 1; display: flex; flex-direction: column; }
          
          .section-header { background-color: var(--secondary-color); color: white; padding: 3px 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .party-content { padding: 6px; font-size: 10px; line-height: 1.4; flex: 1; }
          .party-row { display: flex; margin-bottom: 2px; }
          
          /* Specific Label Widths for alignment */
          .p-label { width: 55px; font-weight: 700; color: #4b5563; flex-shrink: 0; text-transform: uppercase; }
          .p-val { font-weight: 700; color: #111827; flex: 1; word-break: break-word; text-transform: uppercase; }

          /* New Grid Style for Receiver */
          .grid-row { display: flex; width: 100%; margin-bottom: 2px; }
          .grid-col { flex: 1; display: flex; }
          .grid-label { width: 55px; font-weight: 700; color: #4b5563; flex-shrink: 0; text-transform: uppercase; }
          .grid-val { font-weight: 700; color: #111827; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; text-transform: uppercase; }

          /* BOX TABLE */
          .box-wrapper { border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; height: 100%; }
          .box-table { width: 100%; border-collapse: collapse; font-size: 9px; }
          .box-table th { background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 3px; font-weight: 700; }
          .box-table td { border-bottom: 1px solid #cbd5e1; padding: 3px; text-align: center; border-right: 1px solid #eee; }

          /* ITEMS HEADER */
          .cargo-heading-row { display: flex; justify-content: space-between; margin-bottom: 5px; align-items: center; }
          .cargo-badge { background-color: var(--secondary-color); color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
          .weight-badge { font-size: 11px; font-weight: 700; border: 1px solid #000; padding: 2px 8px; border-radius: 4px; }

          /* ITEMS TABLE */
          .items-container { display: flex; gap: 10px; flex: 1; }
          .items-col { flex: 1; display: flex; flex-direction: column; }
          .items-table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; }
          .items-table th { border: 1px solid var(--border-color); padding: 4px; background-color: #fff; font-weight: 700; text-align: center; font-size: 9px; }
          .items-table td { border: 1px solid var(--border-color); padding: 3px 4px; height: 15px; overflow: hidden; white-space: nowrap; }
          
          .col-sl { width: 28px; text-align: center; }
          .col-item { text-align: left; padding-left: 6px !important; text-transform: uppercase; overflow: hidden; }
          .col-qty { width: 38px; text-align: center; }
          .col-w { width: 48px; text-align: center; }
          .box-header-row td { background-color: #f1f5f9; font-weight: 700; text-align: left; padding-left: 8px !important; font-size: 10px; }

          /* FOOTER */
          .total-row td { font-weight: 700; text-align: right; background-color: #fff; border-top: 1px solid #000; height: 20px; padding: 3px 5px; }
          .total-label { display: flex; justify-content: space-between; padding: 0 4px; font-size: 10px; }
          
          .footer-section { margin-top: auto; border-top: 1px solid #e2e8f0; padding-top: 5px; min-height: 85px; }
          .terms-header { display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: var(--secondary-color); margin-bottom: 3px; }
          .terms-content { font-size: 8px; line-height: 1.2; text-align: center; color: #1e1e1e; }
          .term-heading { color: #262262;}
          .signatures { display: flex; justify-content: space-around; margin-top: 12px; font-size: 10px; font-weight: 700; color: var(--secondary-color); padding-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="invoice-sheet">
          <div class="header-grid">
            <div class="header-left">
              ${data.branch_logo ? `<img src="${data.branch_logo}" class="logo-img" />` : `<h2 style="color:#262262; margin:0;">GULF CARGO</h2>`}
              <div class="branch-address">${data.branch_address}</div>
            </div>
            <div class="header-center">
              <div class="qr-img"><img src="${qrUrl}" style="width:100%; height:100%;" /></div>
            </div>
            <div class="header-right">
              <div class="branch-name">${data.branch_name}</div>
              <div class="branch-name-ar">${data.branch_name_ar}</div>
              <div class="branch-contact">${data.branch_contact}</div>
            </div>
          </div>

          <div class="info-bar">
            <div class="info-col">
              <div class="info-label">VAT NO: 310434479300003</div>
              <div class="info-label">TYPE: ${data.shipping_method_name || 'SEA'}</div>
            </div>
            <div class="info-col info-title">
              <div>فاتورة ضريبة مبسطة</div>
              <div>SIMPLIFIED TAX INVOICE</div>
            </div>
            <div class="info-col info-track">
              <span class="info-label">${data.lrl_tracking_code || ''}</span>
              <span class="track-pill">${bookingNo}</span>
            </div>
          </div>

          <div class="main-grid">

            <div class="col-party">
              <div class="section-header">SHIPPER</div>
              <div class="party-content">
                <div class="party-row"><div class="p-label">Name</div><div class="p-val">: ${data.sender?.name || '-'}</div></div>
                <div class="party-row"><div class="p-label">ID No</div><div class="p-val">: ${data.sender?.document_id || '-'}</div></div>
                <div class="party-row"><div class="p-label">Tel</div><div class="p-val">: ${data.sender?.phone || '-'}</div></div>
                <div class="party-row"><div class="p-label">No. Pcs</div><div class="p-val">: ${data.no_of_pieces || safeBoxes.length}</div></div>
                <div class="party-row"><div class="p-label">Weight</div><div class="p-val">: ${parseFloat(totalWeight).toFixed(3)} kg</div></div>
                <div class="party-row"><div class="p-label">Date</div><div class="p-val">: ${formatDate(data.date)}</div></div>
                <div class="party-row"><div class="p-label">Payment</div><div class="p-val">: ${data.payment_method_name || 'Cash'}</div></div>
              </div>
            </div>

            <div class="col-party">
              <div class="section-header">CONSIGNEE</div>
              <div class="party-content">
                <div class="party-row"><div class="p-label">Name</div><div class="p-val">: ${data.receiver?.name || '-'}</div></div>
                <div class="party-row"><div class="p-label">Address</div><div class="p-val">: ${data.receiver?.address || '-'}</div></div>
                
                <div class="grid-row">
                    <div class="grid-col">
                        <div class="grid-label">Post</div>
                        <div class="grid-val">: ${data.receiver?.post || '-'}</div>
                    </div>
                    <div class="grid-col">
                        <div class="grid-label" style="text-align:right; margin-right:5px;">Pin</div>
                        <div class="grid-val">: ${data.receiver?.pin || '-'}</div>
                    </div>
                </div>

                <div class="grid-row">
                    <div class="grid-col">
                        <div class="grid-label">Country</div>
                        <div class="grid-val">: ${data.receiver?.country || 'INDIA'}</div>
                    </div>
                    <div class="grid-col">
                        <div class="grid-label" style="text-align:right; margin-right:5px;">State</div>
                        <div class="grid-val">: ${data.receiver?.state || '-'}</div>
                    </div>
                </div>

                <div class="grid-row">
                    <div class="grid-col">
                        <div class="grid-label">Dist</div>
                        <div class="grid-val">: ${data.receiver?.district || '-'}</div>
                    </div>
                    <div class="grid-col">
                        <div class="grid-label" style="text-align:right; margin-right:5px;">City</div>
                        <div class="grid-val">: ${data.receiver?.city || '-'}</div>
                    </div>
                </div>

                <div class="party-row" style="margin-top: 2px;">
                    <div class="p-label">Tel</div>
                    <div class="p-val">: ${data.receiver?.phone || '-'}</div>
                </div>
              </div>
            </div>

            <div class="col-summary">
               <div class="box-wrapper">
                 <table class="box-table">
                   <thead><tr><th>Box</th><th>INV</th><th>Wgt</th></tr></thead>
                   <tbody>
                     ${boxRows.map(row => `<tr><td>${row.boxNo}</td><td>${data.id}</td><td>${row.weight}</td></tr>`).join('')}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

          <div class="cargo-heading-row">
            <div class="cargo-badge">Cargo Items</div>
            <div class="weight-badge">Total Weight: ${parseFloat(totalWeight).toFixed(3)} kg</div>
          </div>

          <div class="items-container">
            <div class="items-col">
              <table class="items-table">
                <colgroup><col class="col-sl" /><col class="col-item" /><col class="col-qty" /><col class="col-w" /></colgroup>
                <thead><tr><th>SL</th><th>ITEMS</th><th>QTY</th><th>WGT</th></tr></thead>
                <tbody>
                  ${leftRows.map(row => {
                    if (row.isHeader) return `<tr class="box-header-row"><td colspan="4">${row.title}</td></tr>`;
                    return `<tr><td class="col-sl">${row.idx || ''}</td><td class="col-item">${row.name}</td><td class="col-qty">${row.qty}</td><td class="col-w">${row.weight}</td></tr>`;
                  }).join('')}
                  ${leftFillers.map(() => `<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>`).join('')}
                </tbody>
              </table>
            </div>

            <div class="items-col">
              <table class="items-table">
                <colgroup><col class="col-sl" /><col class="col-item" /><col class="col-qty" /><col class="col-w" /></colgroup>
                <thead><tr><th>SL</th><th>ITEMS</th><th>QTY</th><th>WGT</th></tr></thead>
                <tbody>
                  ${rightRows.map(row => {
                    if (row.isHeader) return `<tr class="box-header-row"><td colspan="4">${row.title}</td></tr>`;
                    return `<tr><td class="col-sl">${row.idx || ''}</td><td class="col-item">${row.name}</td><td class="col-qty">${row.qty}</td><td class="col-w">${row.weight}</td></tr>`;
                  }).join('')}
                  ${rightFillers.map(() => `<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>`).join('')}
                </tbody>
                <tfoot>
                  <tr class="total-row"><td colspan="3"><div class="total-label"><span>Total</span><span>المجموع</span></div></td><td>${fmtMoney(data.bill_charges)}</td></tr>
                  <tr class="total-row"><td colspan="3"><div class="total-label"><span>VAT %</span><span>ضريبة</span></div></td><td>${fmtMoney(data.vat_cost)}</td></tr>
                  <tr class="total-row"><td colspan="3"><div class="total-label"><span>Discount</span><span>خصم</span></div></td><td>${fmtMoney(data.amount_discount)}</td></tr>
                  <tr class="total-row" style="background-color: #f8fafc;"><td colspan="3"><div class="total-label"><span>NET TOTAL</span><span>الصافي</span></div></td><td style="font-size: 12px;">${fmtMoney(data.net_total)}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div class="footer-section">
            <div class="terms-header"><div>TERMS AND CONDITIONS</div><div>Thank you for your business.</div></div>
            <div class="terms-content">
               <p class="term-heading">Accept the goods only after checking and confirming them on delivery.</p>
               <p style="margin-top: 2px;">NO GUARANTEE FOR GLASS/BREAKABLE ITEMS. COMPANY NOT RESPONSIBLE FOR ITEMS RECEIVED IN DAMAGED CONDITION. COMPLAINTS WILL NOT BE ACCEPTED AFTER 2 DAYS FROM THE DATE OF DELIVERY. COMPANY NOT RESPONSIBLE FOR OCTROI CHARGES OR ANY OTHER CHARGES LEVIED LOCALLY. IN CASE OF CLAIM (LOSS), PROOF OF DOCUMENTS SHOULD BE PRODUCED. SETTLEMENT WILL BE MADE (20 SAR/KGS) PER COMPANY RULES. COMPANY WILL NOT TAKE RESPONSIBILITY FOR NATURAL CALAMITY AND DELAY IN CUSTOMS CLEARANCE.</p>
               <p style="margin-top: 2px;">الشروط: 1. لا توجد مطالب ضد الشركة الناشئة للخسائر الناتجة عن الحوادث الطبيعية أو تأخير التخليص الجمركي. 2. لا تتحمل الشركة مسؤولية أي خسارة ناتجة عن سوء الاستخدام أو الأضرار غير المسؤولة أو المسؤوليات المترتبة على أي رسوم ومعاملات تفرض من قبل السلطات الجمركية. 3. الشركة غير مسؤولة عن أي مسؤوليات قانونية ناشئة عن المستندات المفقودة أو التالفة. 4. يتحمل المستلم أو المشتري جميع الرسوم الإضافية، بما في ذلك رسوم التخزين والغرامات المفروضة من قبل الجمارك.</p>
               <p style="margin-top: 2px;">ഡെലിവറി ചെയ്യുമ്പോൾ സാധനങ്ങൾ പരിശോധിച്ച് ഉറപ്പ് വരുത്തിയതിന് ശേഷം മാത്രം സ്വീകരിക്കുക.</p>
            </div>
            <div class="signatures"><div>Shipper Signature</div><div>Consignee Signature</div><div>Manager Signature</div></div>
          </div>
        </div>
      </body>
    </html>
  `;
};

// --- 3. PUBLIC METHODS ---

export const printInvoice = async (idOrData) => {
  try {
    const data = await fetchInvoiceData(idOrData);
    const html = createInvoiceHTML(data);
    
    // 1. Generate PDF
    const { uri } = await Print.printToFileAsync({ html });
    
    // 2. Prepare Filename
    const bookingNo = data.booking_no || data.invoice_no || `Invoice-${data.id}`;
    const safeFilename = bookingNo.replace(/[^a-zA-Z0-9-_]/g, '_');
    const newUri = `${FileSystem.documentDirectory}${safeFilename}.pdf`;

    // 3. Rename with legacy fallback
    try {
        await FileSystem.moveAsync({ from: uri, to: newUri });
    } catch (e) {
        console.warn("Failed to rename PDF (moveAsync failed):", e);
        // Fallback to sharing original if move fails
        await Sharing.shareAsync(uri, { 
            UTI: '.pdf', 
            mimeType: 'application/pdf',
            dialogTitle: `Share Invoice ${bookingNo}` 
        });
        return;
    }

    // 4. Share Renamed File
    await Sharing.shareAsync(newUri, { 
        UTI: '.pdf', 
        mimeType: 'application/pdf',
        dialogTitle: `Share Invoice ${bookingNo}` 
    });

  } catch (error) {
    console.error('Error printing invoice:', error);
  }
};

export const generateInvoicePDF = printInvoice;