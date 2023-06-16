import fs from 'fs';

export const saveFile = (name, content) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(name, content, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export default saveFile;
