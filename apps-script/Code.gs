const SHEET_ID = "1TryXVVdDiewv_epYMBal0pH3gI90bYhi1d4nCz1d-OU";
const SHEET_NAMES = {
  ITEMS: "items",
  SALES: "sales",
  VENDORS: "vendors",
};
const SHEET_HEADERS = {
  items: ["id", "name", "brand", "category", "purchasePrice", "sellingPrice", "quantity"],
  sales: ["transactionId", "itemId", "quantity", "sellingPrice", "purchasePrice", "profit", "createdAt"],
  vendors: ["vendorId", "name", "contact"],
};

function setupSheets() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const result = {};

  Object.keys(SHEET_HEADERS).forEach(function (sheetName) {
    const expectedHeaders = SHEET_HEADERS[sheetName];
    let sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      result[sheetName] = "created";
    } else {
      result[sheetName] = "updated";
    }

    const currentHeaders = sheet
      .getRange(1, 1, 1, expectedHeaders.length)
      .getValues()[0]
      .map(function (value) {
        return String(value).trim();
      });

    const needsHeaderUpdate = expectedHeaders.some(function (header, index) {
      return currentHeaders[index] !== header;
    });

    if (needsHeaderUpdate) {
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    }
  });

  Logger.log("setupSheets completed: " + JSON.stringify(result));
  return result;
}

function doGet(e) {
  try {
    const action = String((e.parameter && e.parameter.action) || "");
    if (action === "getItems") return jsonResponse(getItems());
    if (action === "getDailyReport") return jsonResponse(getDailyReport());
    if (action === "getMonthlyReport") return jsonResponse(getMonthlyReport());
    return jsonResponse({ ok: false, message: "Invalid action" }, 400);
  } catch (error) {
    return jsonResponse({ ok: false, message: String(error) }, 500);
  }
}

function doPost(e) {
  try {
    const body = parseBody(e);
    const action = String(body.action || "");

    if (action === "createItem") return jsonResponse(createItem(body));
    if (action === "updateItem") return jsonResponse(updateItem(String(body.id || ""), body));
    if (action === "deleteItem") return jsonResponse(deleteItem(String(body.id || "")));
    if (action === "createSale") return jsonResponse(createSale(body));

    return jsonResponse({ ok: false, message: "Invalid action" }, 400);
  } catch (error) {
    return jsonResponse({ ok: false, message: String(error) }, 500);
  }
}

function getItems() {
  const rows = getSheet(SHEET_NAMES.ITEMS).getDataRange().getValues();
  return mapRowsToObjects(rows);
}

function createItem(payload) {
  const sheet = getSheet(SHEET_NAMES.ITEMS);
  const headers = getHeaders(sheet);
  const item = {
    id: payload.id || Utilities.getUuid(),
    name: payload.name || "",
    brand: payload.brand || "",
    category: payload.category || "",
    purchasePrice: Number(payload.purchasePrice || 0),
    sellingPrice: Number(payload.sellingPrice || 0),
    quantity: Number(payload.quantity || 0),
  };
  sheet.appendRow(buildRow(headers, item));
  return { ok: true, item: item };
}

function updateItem(itemId, payload) {
  const sheet = getSheet(SHEET_NAMES.ITEMS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf("id");
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === itemId) {
      const updated = {
        id: itemId,
        name: payload.name || "",
        brand: payload.brand || "",
        category: payload.category || "",
        purchasePrice: Number(payload.purchasePrice || 0),
        sellingPrice: Number(payload.sellingPrice || 0),
        quantity: Number(payload.quantity || 0),
      };
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([buildRow(headers, updated)]);
      return { ok: true, item: updated };
    }
  }
  return { ok: false, message: "Item not found" };
}

function deleteItem(itemId) {
  const sheet = getSheet(SHEET_NAMES.ITEMS);
  const values = sheet.getDataRange().getValues();
  const idIndex = values[0].indexOf("id");
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === itemId) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, message: "Item not found" };
}

function createSale(payload) {
  if (payload.lines && payload.lines.length) {
    return createBulkSale(payload.lines);
  }
  return { ok: false, message: "No sale lines provided" };
}

function createBulkSale(lines) {
  const saleId = Utilities.getUuid();
  let total = 0;
  let totalProfit = 0;
  const salesSheet = getSheet(SHEET_NAMES.SALES);
  const itemsSheet = getSheet(SHEET_NAMES.ITEMS);
  const itemRows = itemsSheet.getDataRange().getValues();
  const itemHeaders = itemRows[0];
  const salesHeaders = getHeaders(salesSheet);

  const itemIdIndex = itemHeaders.indexOf("id");
  const itemPurchaseIndex = itemHeaders.indexOf("purchasePrice");
  const itemSellingIndex = itemHeaders.indexOf("sellingPrice");
  const itemQtyIndex = itemHeaders.indexOf("quantity");

  for (var i = 0; i < lines.length; i++) {
    const line = lines[i];
    const saleItemId = String(line.itemId || "");
    const saleQty = Number(line.quantity || 0);
    if (!saleItemId || saleQty <= 0) return { ok: false, message: "Invalid sale line" };

    let rowIndex = -1;
    for (var r = 1; r < itemRows.length; r++) {
      if (String(itemRows[r][itemIdIndex]) === saleItemId) {
        rowIndex = r;
        break;
      }
    }
    if (rowIndex === -1) return { ok: false, message: "Item not found: " + saleItemId };

    const currentQty = Number(itemRows[rowIndex][itemQtyIndex] || 0);
    if (currentQty < saleQty) return { ok: false, message: "Insufficient stock for " + saleItemId };

    const purchasePrice = Number(itemRows[rowIndex][itemPurchaseIndex] || 0);
    const sellingPrice = Number(itemRows[rowIndex][itemSellingIndex] || 0);
    const profit = (sellingPrice - purchasePrice) * saleQty;

    const updatedQty = currentQty - saleQty;
    itemRows[rowIndex][itemQtyIndex] = updatedQty;
    itemsSheet.getRange(rowIndex + 1, itemQtyIndex + 1).setValue(updatedQty);

    const saleRecord = {
      transactionId: saleId,
      itemId: saleItemId,
      quantity: saleQty,
      sellingPrice: sellingPrice,
      purchasePrice: purchasePrice,
      profit: profit,
      createdAt: new Date().toISOString(),
    };
    salesSheet.appendRow(buildRow(salesHeaders, saleRecord));

    total += sellingPrice * saleQty;
    totalProfit += profit;
  }

  return { ok: true, transactionId: saleId, total: total, totalProfit: totalProfit };
}

function getDailyReport() {
  const sales = mapRowsToObjects(getSheet(SHEET_NAMES.SALES).getDataRange().getValues());
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const todaySales = sales.filter(function (sale) {
    return String(sale.createdAt || "").slice(0, 10) === today;
  });
  return summarizeSales(todaySales);
}

function getMonthlyReport() {
  const sales = mapRowsToObjects(getSheet(SHEET_NAMES.SALES).getDataRange().getValues());
  const month = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM");
  const monthSales = sales.filter(function (sale) {
    return String(sale.createdAt || "").slice(0, 7) === month;
  });
  return summarizeSales(monthSales);
}

function summarizeSales(sales) {
  const transactionIds = {};
  const totals = sales.reduce(
    function (acc, sale) {
      const amount = Number(sale.sellingPrice || 0) * Number(sale.quantity || 0);
      acc.totalRevenue += amount;
      acc.totalProfit += Number(sale.profit || 0);
      acc.totalItemsSold += Number(sale.quantity || 0);
      if (sale.transactionId) {
        transactionIds[sale.transactionId] = true;
      }
      return acc;
    },
    { totalRevenue: 0, totalProfit: 0, totalTransactions: 0, totalItemsSold: 0 },
  );
  totals.totalTransactions = Object.keys(transactionIds).length;
  return totals;
}

function getSheet(name) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
  if (!sheet) {
    throw new Error("Sheet not found: " + name);
  }
  return sheet;
}

function getHeaders(sheet) {
  const values = sheet.getDataRange().getValues();
  if (!values.length) throw new Error("Sheet has no header row");
  return values[0].map(function (h) {
    return String(h).trim();
  });
}

function buildRow(headers, record) {
  return headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(record, header) ? record[header] : "";
  });
}

function parseBody(e) {
  return e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
}

function jsonResponse(payload, statusCode) {
  const body = Object.assign({ statusCode: statusCode || 200 }, payload);
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function mapRowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map(function (row) {
    const obj = {};
    headers.forEach(function (key, index) {
      obj[key] = row[index];
    });
    return obj;
  });
}

