import { StyleSheet } from 'react-native';
import colors from '../styles/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    color: colors.seconday
  },
  subheadline: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 24,
    marginTop: -25,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  passwordContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12, // Padding on sides only, let Input handle vertical
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1, // Takes up remaining space
    paddingVertical: 12, // Match the padding of the regular input
  },
  button: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16
  },

//   DASHOARD STYLES
dashboardContainer: {
  flex: 1,
  backgroundColor: '#f7f7f7ff'
},
statsContainer: {
    flexDirection: 'row', // Aligns cards side-by-side
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5ff',
    paddingTop: 20,
    width: '100%',
    height: '100%'
  },
  statCard: {
    backgroundColor: '#fff',
    width: '48%', // Takes up roughly half the screen
    height: 75,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row', // Icon left, text right
    alignItems: 'center',
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
});
