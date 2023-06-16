import fs from 'fs';

export const saveFile = (name, content) => {
  fs.writeFileSync(name, content);
};

export default saveFile;
