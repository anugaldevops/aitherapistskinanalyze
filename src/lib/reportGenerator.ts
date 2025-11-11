import { SkinAgeEstimate } from './skinAgeCalculation';
import { ClinicalScore } from './clinicalScoring';
import { FuturePrediction } from './futurePrediction';

export interface ReportData {
  skinAgeEstimate: SkinAgeEstimate;
  clinicalScore: ClinicalScore;
  futurePrediction: FuturePrediction;
  selectedYears: number;
}

function getAssessmentLabel(compositeIndex: number): string {
  if (compositeIndex < 15) return 'Excellent';
  if (compositeIndex < 30) return 'Very Good';
  if (compositeIndex < 45) return 'Good';
  if (compositeIndex < 55) return 'Moderate';
  return 'Accelerated Aging';
}

function getCurrentDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function generateReportHTML(data: ReportData): string {
  const { skinAgeEstimate, clinicalScore, futurePrediction, selectedYears } = data;
  const assessment = getAssessmentLabel(skinAgeEstimate.compositeIndex);
  const healthyScenario = futurePrediction.healthyScenarios.find(s => s.yearsFromNow === selectedYears);
  const currentScenario = futurePrediction.currentPathScenarios.find(s => s.yearsFromNow === selectedYears);
  const difference = currentScenario && healthyScenario ? currentScenario.skinAge - healthyScenario.skinAge : 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #1e293b;
    }
    .report {
      background: white;
      max-width: 900px;
      margin: 0 auto;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 36px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .header .subtitle {
      font-size: 16px;
      opacity: 0.95;
      margin-top: 8px;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 35px;
    }
    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #6366f1;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }
    .summary-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .summary-card.highlighted {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-color: #f59e0b;
    }
    .summary-card-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .summary-card-value {
      font-size: 32px;
      font-weight: 800;
      color: #1e293b;
    }
    .summary-card-subtitle {
      font-size: 14px;
      color: #64748b;
      margin-top: 4px;
    }
    .zone-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .zone-table th {
      background: #6366f1;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    .zone-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .zone-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .score-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
    }
    .score-0 { background: #dcfce7; color: #166534; }
    .score-1 { background: #fef9c3; color: #854d0e; }
    .score-2 { background: #fed7aa; color: #9a3412; }
    .score-3 { background: #fecaca; color: #991b1b; }
    .priority-list {
      list-style: none;
      padding: 0;
    }
    .priority-item {
      background: #f8fafc;
      padding: 20px;
      margin-bottom: 15px;
      border-left: 4px solid #6366f1;
      border-radius: 6px;
    }
    .priority-item h3 {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 10px;
    }
    .priority-item ul {
      margin-left: 20px;
      margin-top: 10px;
    }
    .priority-item li {
      margin-bottom: 6px;
      color: #475569;
      line-height: 1.5;
    }
    .future-comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
    }
    .future-card {
      padding: 25px;
      border-radius: 8px;
      border: 2px solid;
    }
    .future-card.healthy {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-color: #10b981;
    }
    .future-card.current {
      background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
      border-color: #f97316;
    }
    .future-card h3 {
      font-size: 18px;
      margin-bottom: 15px;
      font-weight: 700;
    }
    .future-card .age-display {
      font-size: 48px;
      font-weight: 800;
      text-align: center;
      margin: 20px 0;
    }
    .future-card .age-display.healthy-color { color: #059669; }
    .future-card .age-display.current-color { color: #ea580c; }
    .recommendations-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #f59e0b;
      margin-top: 20px;
    }
    .recommendations-box h3 {
      font-size: 18px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 15px;
    }
    .recommendations-box ul {
      margin-left: 20px;
    }
    .recommendations-box li {
      margin-bottom: 8px;
      color: #78350f;
      line-height: 1.6;
    }
    .footer {
      background: #f1f5f9;
      padding: 30px 40px;
      border-top: 3px solid #6366f1;
    }
    .footer-text {
      font-size: 13px;
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    .footer-text strong {
      color: #1e293b;
    }
    .disclaimer {
      background: #fef3c7;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #f59e0b;
      margin-top: 15px;
    }
    .disclaimer-text {
      font-size: 12px;
      color: #78350f;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="report">
    <div class="header">
      <h1>SkinAge AI</h1>
      <div class="subtitle">Clinical Facial Analysis Report</div>
      <div class="subtitle" style="margin-top: 15px;">
        <strong>Date:</strong> ${getCurrentDate()} | <strong>Age:</strong> ${skinAgeEstimate.actualAge} years
      </div>
    </div>

    <div class="content">
      <!-- Section 1: Summary -->
      <div class="section">
        <h2 class="section-title">Analysis Summary</h2>
        <div class="summary-grid">
          <div class="summary-card highlighted">
            <div class="summary-card-label">Estimated Skin Age</div>
            <div class="summary-card-value">${skinAgeEstimate.estimatedSkinAge}</div>
            <div class="summary-card-subtitle">years</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">Actual Age</div>
            <div class="summary-card-value">${skinAgeEstimate.actualAge}</div>
            <div class="summary-card-subtitle">years</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">Difference</div>
            <div class="summary-card-value">${skinAgeEstimate.ageDifference > 0 ? '+' : ''}${skinAgeEstimate.ageDifference}</div>
            <div class="summary-card-subtitle">years</div>
          </div>
        </div>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-card-label">Clinical Score</div>
            <div class="summary-card-value">${clinicalScore.totalScore}/21</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">Composite Index</div>
            <div class="summary-card-value">${skinAgeEstimate.compositeIndex.toFixed(1)}</div>
            <div class="summary-card-subtitle">out of 100</div>
          </div>
          <div class="summary-card highlighted">
            <div class="summary-card-label">Assessment</div>
            <div class="summary-card-value" style="font-size: 20px;">${assessment}</div>
          </div>
        </div>
      </div>

      <!-- Section 2: Zone Breakdown -->
      <div class="section">
        <h2 class="section-title">Zone-by-Zone Analysis</h2>
        <table class="zone-table">
          <thead>
            <tr>
              <th>Facial Zone</th>
              <th>Wrinkle Score</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            ${clinicalScore.zones.map(zone => `
              <tr>
                <td><strong>${zone.displayName}</strong></td>
                <td><span class="score-badge score-${zone.wrinkleScore}">${zone.wrinkleScore}/3</span></td>
                <td>${zone.wrinkleScore === 0 ? 'None' : zone.wrinkleScore === 1 ? 'Mild' : zone.wrinkleScore === 2 ? 'Moderate' : 'Severe'}</td>
              </tr>
            `).join('')}
            <tr>
              <td><strong>Overall Pigmentation</strong></td>
              <td><span class="score-badge score-${clinicalScore.overallPigmentationScore}">${clinicalScore.overallPigmentationScore}/3</span></td>
              <td>${clinicalScore.overallPigmentationScore === 0 ? 'Even' : 'Uneven'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 3: Priority Concerns -->
      <div class="section">
        <h2 class="section-title">Priority Concerns</h2>
        <ul class="priority-list">
          ${skinAgeEstimate.topConcerns.map((concern, idx) => `
            <li class="priority-item">
              <h3>${idx + 1}. ${concern.displayName} (Score: ${concern.score}/3)</h3>
              <p style="color: #64748b; margin-top: 5px;">Model Weight: ${(concern.weight * 100).toFixed(0)}% of aging assessment</p>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Section 4: Future Outlook -->
      <div class="section">
        <h2 class="section-title">Future Outlook (${selectedYears} Years)</h2>
        <div class="future-comparison">
          <div class="future-card healthy">
            <h3 style="color: #065f46;">Healthy Lifestyle Path</h3>
            <div class="age-display healthy-color">${healthyScenario?.skinAge}</div>
            <p style="text-align: center; color: #047857; font-weight: 600;">
              Estimated Skin Age<br>
              <small style="font-size: 14px;">At age ${healthyScenario?.actualAge}</small>
            </p>
            <p style="margin-top: 15px; color: #065f46; font-size: 14px;">
              With consistent sun protection, retinoids, and healthy habits
            </p>
          </div>
          <div class="future-card current">
            <h3 style="color: #9a3412;">Current Path</h3>
            <div class="age-display current-color">${currentScenario?.skinAge}</div>
            <p style="text-align: center; color: #c2410c; font-weight: 600;">
              Estimated Skin Age<br>
              <small style="font-size: 14px;">At age ${currentScenario?.actualAge}</small>
            </p>
            <p style="margin-top: 15px; color: #9a3412; font-size: 14px;">
              Without intervention or lifestyle changes
            </p>
          </div>
        </div>
        <div style="background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%); padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px; border: 2px solid #8b5cf6;">
          <p style="font-size: 24px; font-weight: 800; color: #6b21a8; margin-bottom: 10px;">
            Potential Benefit: ${difference} Years
          </p>
          <p style="font-size: 16px; color: #7c3aed;">
            Good skincare can make you look ${difference} years younger in ${selectedYears} years!
          </p>
        </div>
      </div>

      <!-- Section 5: Recommendations -->
      <div class="section">
        <h2 class="section-title">Personalized Skincare Recommendations</h2>
        <div class="recommendations-box">
          <h3>Core Daily Routine:</h3>
          <ul>
            <li><strong>Morning:</strong> Gentle cleanser → Vitamin C serum → Moisturizer → SPF 50+ (reapply every 2 hours in sun)</li>
            <li><strong>Evening:</strong> Gentle cleanser → Retinol 0.025-0.1% (start 2x/week, increase gradually) → Hydrating moisturizer</li>
            <li><strong>Weekly:</strong> Gentle exfoliation 1-2x, hydrating masks</li>
          </ul>
        </div>
        <div class="recommendations-box" style="margin-top: 15px;">
          <h3>Priority Treatments Based on Your Analysis:</h3>
          <ul>
            ${skinAgeEstimate.topConcerns.map(concern => `
              <li><strong>${concern.displayName}:</strong> Retinol, peptides, consider professional treatments (Botox, fillers, laser)</li>
            `).join('')}
            ${clinicalScore.overallPigmentationScore > 0 ? '<li><strong>Pigmentation:</strong> Vitamin C + Niacinamide serums, strict SPF, chemical peels</li>' : ''}
          </ul>
        </div>
        <div class="recommendations-box" style="margin-top: 15px;">
          <h3>Lifestyle Factors:</h3>
          <ul>
            <li>☀️ Daily sun protection is the #1 anti-aging strategy</li>
            <li>💧 Stay hydrated (8+ glasses water daily)</li>
            <li>🚭 Avoid smoking and limit alcohol</li>
            <li>😴 Get 7-9 hours quality sleep</li>
            <li>🥗 Eat antioxidant-rich foods (berries, leafy greens)</li>
            <li>🧘 Manage stress through meditation or exercise</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer">
      <p class="footer-text">
        <strong>Scientific Validation:</strong> Analysis based on research-validated SCINEXA system (Robic et al., 2023)
        with R² = 0.70 correlation to chronological age.
      </p>
      <p class="footer-text">
        <strong>Report Generated:</strong> ${getCurrentDate()} by SkinAge AI Clinical Analysis Platform
      </p>
      <div class="disclaimer">
        <p class="disclaimer-text">
          <strong>Medical Disclaimer:</strong> This report is for informational and educational purposes only.
          It does not constitute medical advice and should not replace consultation with a board-certified dermatologist
          or healthcare provider. Individual results may vary based on genetics, lifestyle, environmental factors,
          and treatment adherence. For personalized medical advice, diagnosis, or treatment recommendations,
          please consult a qualified healthcare professional.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function generatePDFReport(data: ReportData): Promise<void> {
  console.log('🎨 Generating PDF report...');

  const [html2canvas, { default: jsPDF }] = await Promise.all([
    import('html2canvas').then(m => m.default),
    import('jspdf')
  ]);

  const html = generateReportHTML(data);

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '900px';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#667eea'
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

    const filename = `SkinAge-Analysis-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

    console.log('✅ PDF report generated:', filename);
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    throw error;
  }
}

export function generateShareableText(data: ReportData): string {
  const { skinAgeEstimate, futurePrediction, selectedYears } = data;
  const assessment = getAssessmentLabel(skinAgeEstimate.compositeIndex);
  const healthyScenario = futurePrediction.healthyScenarios.find(s => s.yearsFromNow === selectedYears);
  const currentScenario = futurePrediction.currentPathScenarios.find(s => s.yearsFromNow === selectedYears);

  return `
🔬 SkinAge AI Analysis Results

📊 Summary:
• Estimated Skin Age: ${skinAgeEstimate.estimatedSkinAge} years
• Actual Age: ${skinAgeEstimate.actualAge} years
• Difference: ${skinAgeEstimate.ageDifference > 0 ? '+' : ''}${skinAgeEstimate.ageDifference} years
• Composite Index: ${skinAgeEstimate.compositeIndex.toFixed(1)}/100
• Assessment: ${assessment}

🔮 Future Outlook (${selectedYears} years):
• Healthy Path: ${healthyScenario?.skinAge} years
• Current Path: ${currentScenario?.skinAge} years
• Potential Benefit: ${currentScenario && healthyScenario ? currentScenario.skinAge - healthyScenario.skinAge : 0} years with good skincare!

⚠️ Top Concerns:
${skinAgeEstimate.topConcerns.map((c, i) => `${i + 1}. ${c.displayName} (${c.score}/3)`).join('\n')}

💡 Key Recommendations:
✓ Daily SPF 50+ (prevents 80% of aging)
✓ Nightly retinol/retinoid
✓ Vitamin C + antioxidants
✓ Hydration & stress management

Generated by SkinAge AI - Clinical-grade facial analysis
  `.trim();
}
