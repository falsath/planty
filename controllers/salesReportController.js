
const excel = require('exceljs');

const puppeter = require('puppeteer');
const PDFDocument = require('pdfkit');
const fs = require('fs-extra');

const path = require('path');

const ejs = require('ejs')

const Order = require('../model/orderModel');


const loadReport = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = 3; // Number of documents per page
      console.log('endDate:',req.query.endDate)

      if (req.query.startDate && req.query.endDate) {
          const filteredOrders = await Order.find({
              status: 'Delivered',
              orderPlacedAt: {
                  $gte: new Date(req.query.startDate),
                  $lte: new Date(req.query.endDate),
              },
          })
          .populate('products.product')
          .sort({ orderPlacedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);

          console.log('filteredOrders:', filteredOrders);

          res.status(200).json(filteredOrders);
      } else {
          const totalCount = await Order.countDocuments({ status: 'Delivered' });
          const totalPages = Math.ceil(totalCount / limit);

          const orderDatas = await Order.find({ status: 'Delivered' })
          .populate('products.product')
          .sort({ orderPlacedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();

          const orderData = orderDatas.map((order) => ({
              ...order,
              orderPlacedAt: new Date(order.orderPlacedAt).toLocaleDateString(),
          }));

          console.log('orderData:', orderData);

          res.render('salesReport', { orderData, totalPages, currentPage: page });
      }
  } catch (err) {
      console.log(err.message);
      res.status(500).send('Internal Server Error');
  }
};



const exportExcelOrders = async (req, res) => {

  try {

    const { startDate, endDate } = req.query;
    if (startDate && endDate) {

      const orders = await Order.find({
        status: 'Delivered',
        orderPlacedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        }
      }).populate('products.product').exec();
      orders.sort((a, b) => new Date(b.orderPlacedAt) - new Date(a.orderPlacedAt));

      const data = [];
      orders.forEach(order => {
        const productDetails = order.products.map(product => {
          if (product.product) {
            return `${product.product.name} (Qty: ${product.quantity}, Price: ${product.price})`;
          } else {
            return "Product not found";
          }
        }).join(', ');
          console.log('productDetails',productDetails)
        const address = order.address; // Directly access the address object
  
        data.push({
          fullname: order.name,
          email: order.email,
          paymentMethod: order.paymentMethod,
          status: order.status,
          productDetails: productDetails,
          address: address.address,
          city: address.city,
          pincode: address.pincode,
          state: address.state,
        });
      });

      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet("Orders");
      worksheet.columns = [
        { header: "Fullname", key: "name", width: 20 },
        { header: "Email", key: "email", width: 20, numFmt: '0' },
        { header: "Payment Method", key: "paymentMethod", width: 20 },
        { header: "Status", key: "status", width: 20 },
        { header: "Product Details", key: "productDetails", width: 30 },
        { header: "Address", key: "address", width: 30 },
        { header: "City", key: "city", width: 15 },
        { header: "Pincode", key: "pincode", width: 10 },
        { header: "State", key: "state", width: 15 },
      ];
      data.forEach((order) => {
        const row = worksheet.addRow(order);
        row.height = 30
      });
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true }
        worksheet.getRow(1).height = 20;
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader("Content-Disposition", `attachment; filename = orders.xlsx`);
      return workbook.xlsx.write(res).then(() => {
        res.status(200).end();
      });

    } else {
      const orders = await Order.find({ status: 'Delivered' }).populate('products.product');
      orders.sort((a, b) => new Date(b.orderPlacedAt) - new Date(a.orderPlacedAt));

      const data = [];
      orders.forEach(order => {
        const productDetails = order.products.map(product => {
          if (product.product) {
            return `${product.product.name} (Qty: ${product.quantity}, Price: ${product.price})`;
          } else {
            return "Product not found";
          }
        }).join(', ');
                const address = order.address;
        console.log('productDetails',productDetails)

          data.push({
            name: order.name,
            email: order.email,
            paymentMethod: order.paymentMethod,
            status: order.status,
            productDetails: productDetails,
            address: address.address,
            city: address.city,
            pincode: address.pincode,
            state: address.state,
          });
        })
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet("Orders");
      worksheet.columns = [
        { header: "Fullname", key: "name", width: 20 },
        { header: "email", key: "email", width: 10, numFmt: '0' },
        { header: "Payment Method", key: "paymentMethod", width: 5 },
        { header: "Status", key: "status", width: 10 },
        { header: "Product Details", key: "productDetails", width: 30 },
        { header: "Address", key: "address", width: 30 },
        { header: "City", key: "city", width: 15 },
        { header: "Pincode", key: "pincode", width: 10 },
        { header: "State", key: "state", width: 15 },
      ];
      data.forEach((order) => {
        const row = worksheet.addRow(order);

        row.height = 30
      });
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true }
        worksheet.getRow(1).height = 20;
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader("Content-Disposition", `attachment; filename = orders.xlsx`);
      return workbook.xlsx.write(res).then(() => {
        res.status(200).end();
      });
    }

  }
  catch (err) {
    console.log(err.message);
  }
}


const compile = async function (templateName, data) {

  const filePath = path.join(process.cwd(), 'views', 'admin', `${templateName}.ejs`)
  console.log('filePath:',filePath)

  const html = await fs.readFile(filePath, 'utf8');

  return ejs.compile(html)(data)
}






const exportPdfOrders = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filteredDate = '';

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Pipe the PDF to the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=orders_report.pdf');

    if (startDate && endDate) {
      filteredDate = `${startDate} to ${endDate}`;

      // Fetch orders filtered by date range
      const orders = await Order.find({
        status: 'Delivered',
        orderPlacedAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }).populate('products.product').exec();
      orders.sort((a, b) => new Date(b.orderPlacedAt) - new Date(a.orderPlacedAt));

      // Generate the PDF content
      doc.fontSize(20).text('Orders Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Date Range: ${filteredDate}`);
      doc.moveDown();

      // Add table headers
      const headers = [
        { label: 'Fullname', width: 100 },
        { label: 'Email', width: 150 },
        { label: 'Payment Method', width: 100 },
        { label: 'Status', width: 80 },
        { label: 'Product Details', width: 200 },
        { label: 'Address', width: 150 },
        { label: 'City', width: 100 },
        { label: 'Pincode', width: 70 },
        { label: 'State', width: 100 },
      ];

      // Table header
      headers.forEach((header, index) => {
        doc.fontSize(10).text(header.label, {
          continued: index < headers.length - 1,
          width: header.width
        });
      });
      doc.moveDown();

      // Add a line separator after headers
      doc.lineWidth(0.5).moveTo(doc.x, doc.y).lineTo(doc.x + 500, doc.y).stroke();
      doc.moveDown();

      // Add order data
      orders.forEach(order => {
        const productDetails = order.products.map(product => {
          if (product.product) {
            return `${product.product.name} (Qty: ${product.quantity}, Price: ${product.product.price})`;
          } else {
            return "Product not found";
          }
        }).join(', ');

        const address = order.address;

        const row = [
          order.name,
          order.email,
          order.paymentMethod,
          order.status,
          productDetails,
          address.address,
          address.city,
          address.pincode,
          address.state,
        ];

        // Add row to the table
        row.forEach((item, index) => {
          doc.fontSize(10).text(item, {
            continued: index < row.length - 1,
            width: headers[index].width
          });
        });
        doc.moveDown();
      });

      // Finalize the document and send it as a response
      doc.end();
      doc.pipe(res);
    } else {
      filteredDate = 'N/A';

      // Fetch all delivered orders if no date range is provided
      const orders = await Order.find({ status: 'Delivered' }).populate('products.product').exec();
      orders.sort((a, b) => new Date(b.orderPlacedAt) - new Date(a.orderPlacedAt));

      // Generate the PDF content
      doc.fontSize(20).text('Orders Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Date Range: ${filteredDate}`);
      doc.moveDown();

      // Add table headers
      const headers = [
        { label: 'Fullname', width: 100 },
        { label: 'Email', width: 150 },
        { label: 'Payment Method', width: 100 },
        { label: 'Status', width: 80 },
        { label: 'Product Details', width: 200 },
        { label: 'Address', width: 150 },
        { label: 'City', width: 100 },
        { label: 'Pincode', width: 70 },
        { label: 'State', width: 100 },
      ];

      // Table header
      headers.forEach((header, index) => {
        doc.fontSize(10).text(header.label, {
          continued: index < headers.length - 1,
          width: header.width
        });
      });
      doc.moveDown();

      // Add a line separator after headers
      doc.lineWidth(0.5).moveTo(doc.x, doc.y).lineTo(doc.x + 500, doc.y).stroke();
      doc.moveDown();

      // Add order data
      orders.forEach(order => {
        const productDetails = order.products.map(product => {
          if (product.product) {
            return `${product.product.name} (Qty: ${product.quantity}, Price: ${product.product.price})`;
          } else {
            return "Product not found";
          }
        }).join(', ');

        const address = order.address;

        const row = [
          order.name,
          order.email,
          order.paymentMethod,
          order.status,
          productDetails,
          address.address,
          address.city,
          address.pincode,
          address.state,
        ];

        // Add row to the table
        row.forEach((item, index) => {
          doc.fontSize(10).text(item, {
            continued: index < row.length - 1,
            width: headers[index].width
          });
        });
        doc.moveDown();
      });

      // Finalize the document and send it as a response
      doc.end();
      doc.pipe(res);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Error generating PDF');
  }
};

// const exportPdfOrders = async (req, res) => {
//   try {
//     let filteredDate = '';
  
//     const browser = await puppeter.launch({ headless: "true",args: ['--no-sandbox', '--disable-setuid-sandbox'] });
//     console.log(browser)

//     const page = await browser.newPage();
//     const { startDate, endDate } = req.query;
//     if (startDate && endDate) {
//       filteredDate = `${startDate} to ${endDate}`;
//       const orderDatas = await Order.find({ status: 'Delivered',orderPlacedAt: { $gte: new Date(startDate), $lte: new Date(endDate) } }).populate('products.product').lean();
//       console.log('pdf orderDatas', orderDatas);
//       orderDatas.sort((a, b) => new Date(b.orderPlacedAt) - new Date(a.orderPlacedAt));
//       const orderData = orderDatas.map(order => {
//         return {
//           ...order,
//           orderPlacedAt: new Date(order.orderPlacedAt).toLocaleDateString()
//         };
//       });
  
//       const content = await compile('pdf', { orderData: orderData,filteredDate });
//       console.log('done creating pdf');
//       await page.setContent(content);

//       const pdfBuffer = await page.pdf({
//         // path:'output.pdf',
//         format: 'A4',
//         printBackground: true
//       });

//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');

//       res.send(pdfBuffer);

     

//       await browser.close();

//     }
//     else {
//       filteredDate = 'Nill';
//       const orderDatas = await Order.find({ status: 'Delivered' }).populate('products.product').lean();
//       console.log('else pdf orderDatas', orderDatas);
//       orderDatas.sort((a, b) => new Date(b.orderPlacedAt) - new Date(a.orderPlacedAt));
//       const orderData = orderDatas.map(order => {
//         return {
//           ...order,
//           orderPlacedAt: new Date(order.orderPlacedAt).toLocaleDateString()
//         };
//       });


//       // const content = await compile('pdf', { orderData: orderData ,filteredDate});

//       const content = await compile('pdf', { orderData: orderData, filteredDate });
// console.log('HTML Content for PDF:', content); // Log the content

//       await page.setContent(content);

//       const pdfBuffer = await page.pdf({
//          path:'output.pdf',
//         format: 'A4',
//         printBackground: true
//       });

//       console.log("PDF saved successfully at output.pdf")

//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
//       res.setHeader('Content-Length', pdfBuffer.length);

//       // res.send(pdfBuffer);
//       res.end(pdfBuffer, 'binary'); 

//       console.log('done creating pdf');

//       await browser.close();

//     }

//   }
//   catch (err) {
//     console.log(err.message);
//   }
// }

module.exports = {
  loadReport,
  exportExcelOrders,
  exportPdfOrders
}


