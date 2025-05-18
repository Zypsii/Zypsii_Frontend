import { StyleSheet } from 'react-native';
import { colors } from '../../utils';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  selectedMedia: {
    width: '100%',
    height: '100%',
  },
   aspectRatioText: {
    marginTop: 5,
    color: '#999',
    fontSize: 14,
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.btncolor,
  },
  inputContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleInput: {
    fontSize: 16,
    color: '#000',
    paddingVertical: 8,
  },
  descriptionInput: {
    fontSize: 16,
    color: '#000',
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.btncolor,
    margin: 15,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    color: colors.fontMainColor,
  },
});

export default styles;