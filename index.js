const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const axios = require("axios");

const {
  createQris,
  checkStatus,
  getProducts,
  order,
  checkOrder
} = require("./function/orkut.js");
const { cekKuota } = require("./function/cekkuota.js");

const app = express();
const PORT = process.env.PORT || 5000;

app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "function")));
app.use(bodyParser.raw({ limit: "50mb", type: "*/*" }));

//EKXTENSI
//CREATE PAYMENT
app.get("/createpayment", async (req, res) => {
  const { codeqr, amount } = req.query;
  if (!codeqr) {
    return res.json({ code: 400, success: false, message: "Kode QR tidak valid", data: null });
  };
  if (!amount) {
    return res.json({ code: 400, success: false, message: "Amount tidak valid", data: null });
  };
  try {
    const qrData = await createQris(codeqr, amount);
    res.json({ code: 200, success: true, message: "Request successfull", data: qrData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//CHECK STATUS
app.get("/checkstatus", async (req, res) => {
  const { username, token } = req.query;
  if (!username) {
    return res.json({ code: 400, success: false, message: "Username tidak valid", data: null });
  };
  if (!token) {
    return res.json({ code: 400, success: false, message: "Token tidak valid", data: null });
  };
  try {
    const qrStatus = await checkStatus(username, token);
    res.json({ code: 200, success: true, message: "Request successfull", data: qrStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/getproducts", async (req, res) => {
  const { category, username, token } = req.query;
  if (!category) {
    return res.json({ code: 400, success: true, message: "Category tidak valid", data: null });
  }
  if (!username) {
    return res.json({ code: 400, success: true, message: "Username tidak valid", data: null });
  }
  if (!token) {
    return res.json({ code: 400, success: true, message: "Token tidak valid", data: null });
  }
  try {
    const products = await getProducts(category, username, token);
    res.json({ code: 200, success: true, message: "Request successfull", data: products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/order", async (req, res) => {
  const { product_id, number, username, token } = req.query;
  if (!product_id) {
    return res.json({ code: 400, success: false, message: "ID produk tidak valid", data: null });
  }
  if (!number) {
    return res.json({ code: 400, success: false, message: "Number tidak valid", data: null });
  }
  if (!username) {
    return res.json({ code: 400, success: false, message: "Username tidak valid", data: null });
  };
  if (!token) {
    return res.json({ code: 400, success: false, message: "Token tidak valid", data: null });
  };
  try {
    const trxStatus = await order(product_id, number, username, token);
    res.json({ code: 200, success: true, message: "Request successfull", data: trxStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/checkorder", async (req, res) => {
  const { id, username, token } = req.query;
  if (!id) {
    return res.json({ code: 400, success: false, message: "Id tidak valid", data: null });
  }
  if (!username) {
    return res.json({ code: 400, success: false, message: "Username tidak valid", data: null });
  };
  if (!token) {
    return res.json({ code: 400, success: false, message: "Token tidak valid", data: null });
  };
  try {
    const trxStatus = await checkOrder(id, username, token);
    res.json({ code: 200, success: true, message: "Request successfull", data: trxStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//CEK KUOTA
app.get("/cekkuota", async (req, res) => {
  const { number } = req.query;
  if (!number) {
    return res.json({ code: 400, success: false, message: "Nomor tidak valid", data: null });
  };
  try {
    const kuota = await cekKuota(number);
    res.json({ code: 200, success: true, message: "Request successfull", data: kuota });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).send("Error");
});
app.use((req, res, next) => {
  res.send("Hello World :)");
});
app.listen(PORT, () => {
  console.log(`Server Telah Berjalan > http://localhost:${PORT}`);
});