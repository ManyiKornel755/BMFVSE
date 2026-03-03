const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

class PDFGenerator {
  static async generateUserDocument(userId, documentType = 'profile') {
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = userRows[0];

    if (!user) {
      throw new Error('User not found');
    }

    const doc = new PDFDocument();
    const fileName = `user_${userId}_${documentType}_${Date.now()}.pdf`;
    const filePath = path.join('uploads', fileName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('User Document', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Document Type: ${documentType}`);
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${user.first_name} ${user.last_name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Phone: ${user.phone || 'N/A'}`);
    doc.text(`Member: ${user.is_member ? 'Yes' : 'No'}`);
    doc.text(`Created: ${new Date(user.created_at).toLocaleString()}`);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  static async generateRaceMinute(data) {
    const arialPath = 'C:\\Windows\\Fonts\\arial.ttf';
    const arialBoldPath = 'C:\\Windows\\Fonts\\arialbd.ttf';

    const doc = new PDFDocument({ size: 'A4', margin: 0 });

    let fontNormal = 'Helvetica';
    let fontBold = 'Helvetica-Bold';
    if (fs.existsSync(arialPath)) {
      doc.registerFont('Arial', arialPath);
      fontNormal = 'Arial';
    }
    if (fs.existsSync(arialBoldPath)) {
      doc.registerFont('Arial-Bold', arialBoldPath);
      fontBold = 'Arial-Bold';
    }

    const uploadsDir = 'uploads';
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `race_minute_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const ML = 25, MT = 25, CW = 545;
    const halfCW = 272;
    const col3W = 181;
    const col3W3 = CW - col3W * 2; // 183

    // Bordered cell with optional text
    const drawCell = (x, y, w, h, text, opts = {}) => {
      doc.rect(x, y, w, h).stroke();
      if (text !== null && text !== undefined && text !== '') {
        const px = opts.px !== undefined ? opts.px : 5;
        const py = opts.py !== undefined ? opts.py : 5;
        doc.font(opts.bold ? fontBold : fontNormal)
          .fontSize(opts.size || 10)
          .text(String(text), x + px, y + py, {
            width: w - px * 2,
            align: opts.align || 'left',
            lineBreak: opts.lineBreak !== false,
            height: h - py * 2
          });
      }
    };

    // ── PAGE 1 ──────────────────────────────────────────────────
    let y = MT;

    // Header: 3 boxes
    const leftW = 130, rightW = 130, titleW = CW - leftW - rightW; // 285
    doc.rect(ML, y, leftW, 50).stroke();
    doc.font(fontNormal).fontSize(10)
      .text(`Korosztály: ${data.korosztaly || ''}`, ML + 5, y + 8, { width: leftW - 10 });
    doc.font(fontNormal).fontSize(9)
      .text(`jellege: ${data.palya_jellege || ''}`, ML + 5, y + 26, { width: leftW - 10 });

    doc.rect(ML + leftW, y, titleW, 50).stroke();
    doc.font(fontBold).fontSize(15)
      .text('VERSENYJEGYZŐKÖNYV', ML + leftW + 5, y + 15, { width: titleW - 10, align: 'center' });

    doc.rect(ML + leftW + titleW, y, rightW, 50).stroke();
    doc.font(fontNormal).fontSize(12)
      .text(`${data.futam_szama || '___'} . futam`, ML + leftW + titleW + 5, y + 15, { width: rightW - 10, align: 'center' });

    y += 55;

    // Info lines
    doc.font(fontNormal).fontSize(10);
    doc.text(`A verseny neve: ${data.verseny_neve || ''}`, ML, y, { width: CW }); y += 16;
    doc.text(`Helye, ideje: ${data.helye || ''}, ${data.ideje || ''}`, ML, y, { width: CW }); y += 16;
    doc.text(`Rendezője: ${data.rendezoje || ''}`, ML, y, { width: CW }); y += 16;
    const lineY = y;
    doc.text(`Versenyvezető: ${data.versenyvezeto || ''}`, ML, lineY, { width: halfCW - 10 });
    doc.text(`Jegyzőkönyvvezető: ${data.jegyzokonyvvezeto || ''}`, ML + halfCW + 10, lineY, { width: halfCW - 10 });
    y += 16;

    doc.moveTo(ML, y).lineTo(ML + CW, y).stroke();
    y += 3;

    // Boats
    drawCell(ML,         y, halfCW,       22, `Rajthajó: ${data.rajthajo || ''}`);
    drawCell(ML + halfCW, y, CW - halfCW, 22, `Célhajó: ${data.celhajo || ''}`);
    y += 22;
    drawCell(ML, y, CW, 22, `Motorosok: ${data.motorosok || ''}`);
    y += 22;

    // Jury
    drawCell(ML, y, CW, 20, 'Versenybíróság tagjai', { align: 'center', bold: true, py: 4 });
    y += 20;
    drawCell(ML,          y, halfCW,       25, `Elnök: ${data.birosag_elnok || ''}`);
    drawCell(ML + halfCW, y, CW - halfCW,  25, `Bírók: ${data.birosag_birok || ''}`);
    y += 25;

    // Wind
    drawCell(ML, y, CW, 20, 'A szél iránya és ereje', { align: 'center', bold: true, py: 4 });
    y += 20;
    drawCell(ML,          y, halfCW,       22, `rajtnál: ${data.szel_rajtnal || ''}`);
    drawCell(ML + halfCW, y, CW - halfCW,  22, `futam közben: ${data.szel_futam_kozben || ''}`);
    y += 22;

    // Starters (3 cols: header + big box)
    const bigH = 78;
    drawCell(ML,             y, col3W,  35, 'Elrajtoltak száma\n(hajóosztályonként)', { size: 9, align: 'center', py: 5 });
    drawCell(ML + col3W,     y, col3W,  35, 'Nem rajtoltak\n(DNC/DNS)',               { size: 9, align: 'center', py: 5 });
    drawCell(ML + col3W * 2, y, col3W3, 35, 'Nem futottak be (DNF)',                  { size: 9, align: 'center', py: 11 });
    y += 35;
    drawCell(ML,             y, col3W,  bigH, data.elrajtoltak_szama || '', { py: 8 });
    drawCell(ML + col3W,     y, col3W,  bigH, data.nem_rajtoltak || '',     { py: 8 });
    drawCell(ML + col3W * 2, y, col3W3, bigH, data.nem_futottak || '',      { py: 8 });
    y += bigH;

    // Flags (3 cols)
    drawCell(ML,             y, col3W,  35, 'Korai rajtolók, (OCS)\n(29.1 vagy 30.1 szabály)', { size: 9, align: 'center', py: 5 });
    drawCell(ML + col3W,     y, col3W,  35, '"Z" lobogós, (ZFP)\n(30.2 szabály)',              { size: 9, align: 'center', py: 5 });
    drawCell(ML + col3W * 2, y, col3W3, 35, '"Fekete" lobogós, (BFD)\n(30.3 szabály)',         { size: 9, align: 'center', py: 5 });
    y += 35;
    drawCell(ML,             y, col3W,  bigH, data.korai_rajtolok || '', { py: 8 });
    drawCell(ML + col3W,     y, col3W,  bigH, data.z_lobogos || '',      { py: 8 });
    drawCell(ML + col3W * 2, y, col3W3, bigH, data.fekete_lobogos || '', { py: 8 });
    y += bigH;

    // Protest
    drawCell(ML, y, CW, 55, `Óvást bejelentő hajók:\n${data.ovast_bejelento || ''}`, { py: 5 });
    y += 55;

    // Finishers
    drawCell(ML,          y, halfCW,      38, `Elsőnek befutott hajó ideje:\n${data.elsonek_ideje || ''}`,   { py: 5 });
    drawCell(ML + halfCW, y, CW - halfCW, 38, `Utolsónak befutott hajó ideje:\n${data.utolsonak_ideje || ''}`, { py: 5 });

    // Page 1 number
    doc.font(fontNormal).fontSize(10).text('1', ML, 820, { width: CW, align: 'center' });

    // ── PAGE 2 ──────────────────────────────────────────────────
    doc.addPage({ size: 'A4', margin: 0 });
    y = MT;

    doc.font(fontNormal).fontSize(10);
    doc.text(`A verseny neve: ${data.verseny_neve || ''}`, ML, y, { width: CW }); y += 16;
    doc.text(`Dátum: ${data.ideje || ''}`, ML, y, { width: CW }); y += 16;
    doc.text(`Futam száma: ${data.futam_szama || ''}`, ML, y, { width: CW }); y += 16;

    doc.moveTo(ML, y).lineTo(ML + CW, y).stroke();
    y += 3;

    // Events table header
    const timeW = 80, eventW = 360, windW = CW - timeW - eventW; // 105
    drawCell(ML,                  y, timeW,  22, 'Időpont',             { align: 'center', bold: true, size: 10, py: 5 });
    drawCell(ML + timeW,          y, eventW, 22, 'Esemény és indoka',   { align: 'center', bold: true, size: 10, py: 5 });
    drawCell(ML + timeW + eventW, y, windW,  22, 'Szélerő, széliirány', { align: 'center', bold: true, size: 9,  py: 6 });
    y += 22;

    // Event rows (28 rows)
    const rowH = 24;
    const esemenyek = Array.isArray(data.esemenyek) ? data.esemenyek : [];
    for (let i = 0; i < 28; i++) {
      const ev = esemenyek[i] || {};
      doc.rect(ML,                  y, timeW,  rowH).stroke();
      doc.rect(ML + timeW,          y, eventW, rowH).stroke();
      doc.rect(ML + timeW + eventW, y, windW,  rowH).stroke();
      if (ev.idopont) doc.font(fontNormal).fontSize(9).text(ev.idopont, ML + 3,                  y + 7, { width: timeW - 6,  lineBreak: false });
      if (ev.esemeny) doc.font(fontNormal).fontSize(9).text(ev.esemeny, ML + timeW + 3,          y + 7, { width: eventW - 6, lineBreak: false });
      if (ev.szelero) doc.font(fontNormal).fontSize(9).text(ev.szelero, ML + timeW + eventW + 3, y + 7, { width: windW - 6,  lineBreak: false });
      y += rowH;
    }

    // Footer
    doc.font(fontNormal).fontSize(10).text('Jegyzőkönyvvezető', ML, y + 10, { width: CW, align: 'right' });

    // Page 2 number
    doc.font(fontNormal).fontSize(10).text('2', ML, 820, { width: CW, align: 'center' });

    doc.end();
    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  static async generateRaceReport(raceReportId) {
    const [reportRows] = await pool.query('SELECT * FROM race_reports WHERE id = ?', [raceReportId]);
    const report = reportRows[0];

    if (!report) {
      throw new Error('Race report not found');
    }

    const [participants] = await pool.query(`
      SELECT 
        rp.*,
        u.first_name,
        u.last_name,
        u.email
      FROM race_participants rp
      LEFT JOIN users u ON rp.user_id = u.id
      WHERE rp.race_report_id = ?
      ORDER BY rp.position IS NULL, rp.position ASC
    `, [raceReportId]);

    const doc = new PDFDocument({ margin: 50 });
    const fileName = `race_report_${raceReportId}_${Date.now()}.pdf`;
    const filePath = path.join('uploads', fileName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(22).text('Versenyjegyzőkönyv', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(16).text(report.race_name, { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Date: ${new Date(report.race_date).toLocaleDateString()}`);
    doc.text(`Location: ${report.location || 'N/A'}`);
    doc.text(`Status: ${report.status}`);
    doc.moveDown(2);

    doc.fontSize(14).text('Participants', { underline: true });
    doc.moveDown();

    if (participants.length > 0) {
      participants.forEach((p, index) => {
        doc.fontSize(11);
        const position = p.position ? `#${p.position}` : 'N/A';
        const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown';
        const sailNumber = p.sail_number || 'N/A';
        const boatClass = p.boat_class || 'N/A';

        doc.text(`${index + 1}. Position: ${position} | ${name} | Sail: ${sailNumber} | Class: ${boatClass}`);
        
        if (p.notes) {
          doc.fontSize(9).text(`   Notes: ${p.notes}`, { color: 'gray' });
        }
        
        doc.moveDown(0.5);
      });
    } else {
      doc.fontSize(11).text('No participants registered yet.', { color: 'gray' });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }
}

module.exports = PDFGenerator;
