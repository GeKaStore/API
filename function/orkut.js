const axios = require('axios');
const fs = require('fs');
const crypto = require("crypto");
const QRCode = require('qrcode');
const { ImageUploadService } = require('node-upload-images')

// Helper functions
function convertCRC16(str) {
  let crc = 0xFFFF;
  const strlen = str.length;
  for (let c = 0; c < strlen; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  let hex = crc & 0xFFFF;
  hex = ("000" + hex.toString(16).toUpperCase()).slice(-4);
  return hex;
};

function generateTransactionId() {
  return crypto.randomBytes(5).toString('hex').toUpperCase()
};

function generateExpirationTime() {
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 5);
  return expirationTime;
};

async function elxyzFile(buffer) {
  return new Promise(async (resolve, reject) => {
    try {
      const service = new ImageUploadService('pixhost.to');
      let { directLink } = await service.uploadFromBinary(buffer, 'wz.png');
      resolve(directLink);
    } catch (error) {
      console.error('🚫 Upload Failed:', error);
      reject(error);
    }
  });
};

async function createQris(codeqr, amount) {
  try {
    let qrisData = codeqr;
    qrisData = qrisData.slice(0, -4);
    const step1 = qrisData.replace("010211", "010212");
    const step2 = step1.split("5802ID");
    amount = amount.toString();
    let uang = "54" + ("0" + amount.length).slice(-2) + amount;
    uang += "5802ID";
    const result = step2[0] + uang + step2[1] + convertCRC16(step2[0] + uang + step2[1]);
    const buffer = await QRCode.toBuffer(result);
    const uploadedFile = await elxyzFile(buffer);
    return {
      transactionId: generateTransactionId(),
      amount: amount,
      expirationTime: generateExpirationTime(),
      qrImageUrl: uploadedFile
    };
  } catch (error) {
    console.error('Error generating and uploading QR code:', error);
    throw error;
  }
};

async function checkStatus(username, token) {
  try {
    const apiUrl = `https://app.orderkuota.com/api/v2/get`;
    const { data } = await axios.post(apiUrl, {
      "app_reg_id": "",
      "phone_uuid": "",
      "requests[qris_history][jenis]": "kredit",
      "phone_model": "itel A666LN",
      "requests[qris_history][keterangan]": "",
      "requests[qris_history][jumlah]": "",
      "phone_android_version": "13",
      "app_version_code": "250327",
      "auth_username": username,
      "requests[qris_history][page]": "1",
      "auth_token": token,
      "app_version_name": "25.03.27",
      "ui_mode": "dark",
      "requests[qris_history][dari_tanggal]": "",
      "requests[0]": "account",
      "requests[qris_history][ke_tanggal]": ""
    }, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip",
        "User-Agent": "okhttp/4.12.0"
      }
    });
    const item = data.qris_history.results;
    const response = item.map((p) => {
      return {
        transactionId: p.id,
        date: p.tanggal.split(" ")[0],
        amount: p.kredit
      }
    });
    return response;
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};

async function getProducts(category, username, token) {
  try {
    const apiUrl = "https://app.orderkuota.com/api/v2/get";
    const { data } = await axios.post(apiUrl, {
      "app_reg_id": "",
      "phone_android_version": "13",
      "app_version_code": "250711",
      "phone_uuid": "",
      "auth_username": username,
      "requests[vouchers][product]": `kuota_${category}`,
      "auth_token": token,
      "app_version_name": "25.07.11",
      "ui_mode": "dark",
      "requests[0]": "balance",
      "phone_model": "itel A666LN"
    }, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip",
        "User-Agent": "okhttp/4.12.0"
      }
    });
    const products = data.vouchers.results;
    return products;
  } catch (err) {
    console.log(err.message);
    throw err;
  }
}

async function order(product, number, username, token) {
  try {
    const apiUrl = "https://app.orderkuota.com/api/v2/order";
    const { data } = await axios.post(apiUrl, {
      "quantity": 1,
      "app_reg_id": "",
      "phone_uuid": "",
      "id_plgn": "",
      "phone_model": "itel A666LN",
      "kode_promo": "",
      "phone_android_version": "13",
      "pin": "",
      "app_version_code": "250327",
      "phone": number,
      "auth_username": username,
      "voucher_id": parseInt(product),
      "payment": "balance",
      "auth_token": token,
      "app_version_name": "25.03.27",
      "ui_mode": "dark"
    }, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip",
        "User-Agent": "okhttp/4.12.0"
      }
    });
    const trx = data.results;
    const response = {
      "id": trx.id,
      "number": trx.no_hp,
      "price": trx.harga,
      "payment": trx.pembayaran,
      "date": trx.tanggal,
      "product_id": trx.voucher.id,
      "product_name": trx.voucher.nominal
    };
    return response;
  } catch (err) {
    console.log(err.message);
    throw err;
  }
}

async function checkOrder(id, username, token) {
  try {
    const productId = parseInt(id);
    const apiUrl = "https://app.orderkuota.com/api/v2/get";
    const { data } = await axios.post(apiUrl, {
      "app_reg_id": "",
      "requests[testimonial][transaction_id]": productId,
      "phone_uuid": "",
      "phone_model": "itel A666LN",
      "requests[transaction_details][id]": productId,
      "phone_android_version": "13",
      "app_version_code": "250711",
      "requests[transaction_details][product_choices_support]": 1,
      "auth_username": username,
      "requests[2]": "print_logo",
      "requests[1]": "account",
      "auth_token": token,
      "app_version_name": "25.07.11",
      "ui_mode": "dark",
      "requests[0]": "recaptcha_key"
    }, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip",
        "User-Agent": "okhttp/4.12.0"
      }
    });
    const trx = data.transaction_details.results;
    const trxData = {
      "id": trx.id,
      "number": trx.phone,
      "product_id": trx.voucher.id,
      "product_name": trx.voucher.name,
      "success": trx.is_success,
      "process": trx.is_in_process,
      "refund": trx.is_refund,
      "date": trx.date,
      "date_str": trx.full_date,
    };
    return trxData;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

module.exports = {
    createQris,
    checkStatus,
    getProducts,
    order,
    checkOrder
};

