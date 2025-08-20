const axios = require("axios");

const ubahNomor = (number) =>
  number.replace(/[^\d+]/g, "").replace("+", "");
const nomorUbah = (number) =>
  `62` + number.slice(1);

async function cekKuota(number) {
  let nomor;
  if (number.startsWith("+62")) {
    nomor = ubahNomor(number);
  } else if (number.startsWith("08")) {
    nomor = nomorUbah(number);
  } else {
    nomor = number;
  }
  try {
    const encodedUrl = "c2lkb21wdWwuaGlqYXViaXJ1Lm15Lmlk";
    const baseUrl = atob(encodedUrl);
    const { data } = await axios.post(`https://${baseUrl}/backend.php`, {
      action: `check_package`,
      device_id: `fake`,
      number: nomor
    });
    return data.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

module.exports = {
  cekKuota
};