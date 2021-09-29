import storage from './storage';

async function getStorage(newOptions) {
  const option = {
    key: '',
    autoSync: true,
    syncInBackground: true,
    syncParams: {
      extraFetchOptions: {

      },
      someFlag: true,
    },
    ...newOptions,
  };
  let result;
  try {
    result = await storage.load(option);
  } catch (e) {
    result = null;
  }
  return result;
}

export default getStorage;