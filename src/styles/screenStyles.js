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
  }
});
