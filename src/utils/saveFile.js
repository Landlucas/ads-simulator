import fs from 'fs';

export const saveFile = (name, content) => {
  if (fs.existsSync(name)) fs.unlinkSync(name);
  fs.writeFileSync(name, content);
};

export default saveFile;
