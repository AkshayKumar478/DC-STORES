
const Order=require('../../models/OrderSchema')
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment=require('moment');




// controller to render salesReport page
exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, reportType = 'daily' } = req.query;
        
        const query = { orderStatus: { $ne: 'Cancelled' } };
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                const parsedStartDate = new Date(startDate);
                if (isNaN(parsedStartDate.getTime())) {
                    return res.status(400).json({ error: 'Invalid start date format' });
                }
                query.createdAt.$gte = parsedStartDate;
            }
            if (endDate) {
                const parsedEndDate = new Date(endDate);
                if (isNaN(parsedEndDate.getTime())) {
                    return res.status(400).json({ error: 'Invalid end date format' });
                }
                query.createdAt.$lte = parsedEndDate;
            }
        }

        const orders = await Order.find(query);
        let aggregatedOrders;
        let report;

        switch(reportType) {
            case 'monthly':
                aggregatedOrders = aggregateSalesByMonth(orders);
                report = calculateReportSummary(aggregatedOrders);
                break;
            case 'weekly':
                aggregatedOrders = aggregateSalesByWeek(orders);
                report = calculateReportSummary(aggregatedOrders);
                break;
            default:
                aggregatedOrders = orders;
                report = {
                    totalSalesCount: orders.length,
                    totalOrderAmount: orders.reduce((sum, order) => sum + order.subtotal, 0),
                    totalDiscount: orders.reduce((sum, order) => sum + order.discountAmount, 0),
                    netSales: orders.reduce((sum, order) => sum + order.finalAmount, 0)
                };
                break;
        }

        res.render('adminLayout', {
            content: 'partials/salesReport',
            title: 'salesReport',
            orders: aggregatedOrders,
            report,
            startDate,
            endDate,
            reportType,
            moment: require('moment') 
        });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).send('Server Error');
    }
};

function aggregateSalesByMonth(orders) {
    const monthlyAggregation = {};

    orders.forEach(order => {
        const monthKey = moment(order.createdAt).format('YYYY-MM');
    
        if (!monthlyAggregation[monthKey]) {
            monthlyAggregation[monthKey] = {
                createdAt: moment(order.createdAt).startOf('month').toDate(),
                subtotal: 0,
                discountAmount: 0,
                finalAmount: 0,
                orderCount: 0
            };
        }
        monthlyAggregation[monthKey].subtotal += order.subtotal;
        monthlyAggregation[monthKey].finalAmount += order.finalAmount;
        monthlyAggregation[monthKey].discountAmount += order.discountAmount;
        monthlyAggregation[monthKey].orderCount++;
    });
    
    return Object.values(monthlyAggregation);
}

function aggregateSalesByWeek(orders) {
    const weeklyAggregation = {};

    orders.forEach(order => {
        const weekKey = moment(order.createdAt).format('YYYY-WW');

        if (!weeklyAggregation[weekKey]) {
            weeklyAggregation[weekKey] = {
                createdAt: moment(order.createdAt).startOf('week').toDate(),
                finalAmount: 0,
                subtotal: 0,
                orderCount: 0,
                discountAmount: 0,
            };
        }
        weeklyAggregation[weekKey].subtotal += order.subtotal;
        weeklyAggregation[weekKey].discountAmount += order.discountAmount;
        weeklyAggregation[weekKey].finalAmount += order.finalAmount;
        weeklyAggregation[weekKey].orderCount++;
    });
    
    return Object.values(weeklyAggregation);
}

function calculateReportSummary(aggregatedOrders) {
    const orders = Array.isArray(aggregatedOrders) ? aggregatedOrders : [];

    return {
        totalSalesCount: orders.reduce((sum, order) => sum + (order.orderCount), 0),
        totalOrderAmount: orders.reduce((sum, order) => sum + (order.subtotal), 0),
        totalDiscount: orders.reduce((sum, order) => sum + (order.discountAmount), 0),
        netSales: orders.reduce((sum, order) => sum + (order.finalAmount), 0)
    };
}
// controller to download salesReport PDF
exports.downloadSalesReportPDF = async (req, res) => {
    try {
        const { startDate, endDate, reportType = 'daily' } = req.query;
        
        const query = { orderStatus: { $ne: 'Cancelled' } };
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                const parsedStartDate = new Date(startDate);
                if (isNaN(parsedStartDate.getTime())) {
                    return res.status(400).json({ error: 'Invalid start date format' });
                }
                query.createdAt.$gte = parsedStartDate;
            }
            if (endDate) {
                const parsedEndDate = new Date(endDate);
                if (isNaN(parsedEndDate.getTime())) {
                    return res.status(400).json({ error: 'Invalid end date format' });
                }
                query.createdAt.$lte = parsedEndDate;
            }
        }

        const orders = await Order.find(query)
            .populate({
                path: 'userId',
                select: 'name email phone'
            })
            .populate({
                path: 'items.productId',
                select: 'productName category'
            })
            .populate('shippingAddress');

        let aggregatedOrders;
        let report;

        switch(reportType) {
            case 'monthly':
                aggregatedOrders = aggregateSalesByMonth(orders);
                report = calculateReportSummary(aggregatedOrders);
                break;
            case 'weekly':
                aggregatedOrders = aggregateSalesByWeek(orders);
                report = calculateReportSummary(aggregatedOrders);
                break;
            default:
                aggregatedOrders = orders;
                report = {
                    totalSalesCount: orders.length,
                    totalOrderAmount: orders.reduce((sum, order) => sum + order.subtotal, 0),
                    totalDiscount: orders.reduce((sum, order) => sum + order.discountAmount, 0),
                    netSales: orders.reduce((sum, order) => sum + order.finalAmount, 0)
                };
                break;
        }

        const doc = new PDFDocument({ margin: 30 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');

        doc.fontSize(16).text('Sales Report', { align: 'center' });
        doc.fontSize(10).text(`Report Period: ${startDate || 'Start'} to ${endDate || 'Present'}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text('Summary Statistics', { underline: true });
        doc.text(`Total Sales Count: ${report.totalSalesCount}`);
        doc.text(`Total Order Amount: $${(report.totalOrderAmount).toFixed(2)}`);
        doc.text(`Total Discount: $${(report.totalDiscount).toFixed(2)}`);
        doc.text(`Net Sales: $${(report.netSales).toFixed(2)}`);
        doc.moveDown();

        // Table Setup
        const tableTop = doc.y;
        const tableLeft = 30;
        const cellPadding = 5;
        const columnWidths = [80, 100, 160, 60, 60, 80];
        const headers = [
            'Date', 
            'Customer', 
            'Email', 
            'Subtotal', 
            'Discount', 
            'Final Amount'
        ];

        doc.fontSize(10).font('Helvetica-Bold');
        headers.forEach((header, i) => {
            doc.text(header, tableLeft + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + cellPadding, tableTop, {
                width: columnWidths[i] - (cellPadding * 2),
                align: 'center'
            });
        });

        doc.moveTo(tableLeft, tableTop + 15)
           .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), tableTop + 15)
           .stroke();

        doc.font('Helvetica');
        let currentY = tableTop + 20;

        aggregatedOrders.forEach((order, index) => {
            if (currentY > doc.page.height - 100) {
                doc.addPage();
                currentY = 30;
            }

            const rowData = [
                moment(order.createdAt).format('YYYY-MM-DD'),
                order.userId?.name || 'N/A',
                order.userId?.email || 'N/A',
                `$${(order.subtotal || 0).toFixed(2)}`,
                `$${(order.discountAmount || 0).toFixed(2)}`,
                `$${(order.finalAmount || 0).toFixed(2)}`
            ];

            rowData.forEach((text, i) => {
                doc.text(text, tableLeft + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + cellPadding, currentY, {
                    width: columnWidths[i] - (cellPadding * 2),
                    align: 'left'
                });
            });

            currentY += 15;

            if (order.items && order.items.length > 0) {
                const productsText = order.items.map(item => 
                    `${item.productId?.productName || 'Unknown'} (Qty: ${item.quantity})`
                ).join(', ');
                
                doc.font('Helvetica-Oblique').fontSize(8);
                doc.text(`Products: ${productsText}`, tableLeft + cellPadding, currentY, {
                    width: columnWidths.reduce((a, b) => a + b, 0) - (cellPadding * 2),
                });
                doc.font('Helvetica').fontSize(10);
                currentY += 10;
            }

            doc.moveTo(tableLeft, currentY)
               .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), currentY)
               .lineWidth(0.5)
               .strokeColor('#CCCCCC')
               .stroke();
            
            currentY += 5;
        });

        doc.end();
        doc.pipe(res);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Server Error');
    }
};


// Updated Excel download controller with more details
exports.downloadSalesReportExcel = async (req, res) => {
    try {
        const { startDate, endDate, reportType = 'daily' } = req.query;
        
        const query = { orderStatus: { $ne: 'Cancelled' } };
       
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                const parsedStartDate = new Date(startDate);
                if (isNaN(parsedStartDate.getTime())) {
                    return res.status(400).json({ error: 'Invalid start date format' });
                }
                query.createdAt.$gte = parsedStartDate;
            }
            if (endDate) {
                const parsedEndDate = new Date(endDate);
                if (isNaN(parsedEndDate.getTime())) {
                    return res.status(400).json({ error: 'Invalid end date format' });
                }
                query.createdAt.$lte = parsedEndDate;
            }
        }

     
        const orders = await Order.find(query)
            .populate({
                path: 'userId',
                select: 'name email phone'
            })
            .populate({
                path: 'items.productId',
                select: 'productName category'
            })
            .populate('shippingAddress');

        let aggregatedOrders;
        let report;

        switch(reportType) {
            case 'monthly':
                aggregatedOrders = aggregateSalesByMonth(orders);
                report = calculateReportSummary(aggregatedOrders);
                break;
            case 'weekly':
                aggregatedOrders = aggregateSalesByWeek(orders);
                report = calculateReportSummary(aggregatedOrders);
                break;
            default:
                aggregatedOrders = orders;
                report = {
                    totalSalesCount: orders.length,
                    totalOrderAmount: orders.reduce((sum, order) => sum + order.subtotal, 0),
                    totalDiscount: orders.reduce((sum, order) => sum + order.discountAmount, 0),
                    netSales: orders.reduce((sum, order) => sum + order.finalAmount, 0)
                };
                break;
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sales Report');

        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Customer Name', key: 'customerName', width: 20 },
            { header: 'Customer Email', key: 'customerEmail', width: 25 },
            { header: 'Payment Method', key: 'paymentMethod', width: 15 },
            { header: 'Order Status', key: 'orderStatus', width: 15 },
            { header: 'Subtotal', key: 'subtotal', width: 10 },
            { header: 'Discount', key: 'discount', width: 10 },
            { header: 'Final Amount', key: 'finalAmount', width: 10 },
            { header: 'Products', key: 'products', width: 40 }
        ];

        aggregatedOrders.forEach(order => {
            const productsString = order.items 
                ? order.items.map(item => 
                    `${item.productId?.productName || 'Unknown'} (Qty: ${item.quantity}, Price: ${item.price})`
                ).join('; ')
                : 'N/A';

            sheet.addRow({
                date: moment(order.createdAt).format('YYYY-MM-DD'),
                customerName: order.userId.name || 'N/A',
                customerEmail: order.userId.email || 'N/A',
                paymentMethod: order.paymentMethod || 'N/A',
                orderStatus: order.orderStatus || 'N/A',
                subtotal: order.subtotal,
                discount: order.discountAmount,
                finalAmount: order.finalAmount,
                products: productsString
            });
        });

        sheet.addRow({}).commit();
        sheet.addRow({
            date: 'Totals',
            subtotal: report.totalOrderAmount,
            discount: report.totalDiscount,
            finalAmount: report.netSales
        }).commit();

        const totalRow = sheet.getRow(sheet.rowCount);
        totalRow.font = { bold: true };

        res.setHeader(
            'Content-Disposition',
            'attachment; filename="sales_report.xlsx"'
        );
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Server Error');
    }
};