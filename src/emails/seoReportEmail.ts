export const generateSeoReportEmail = ({ url, aiSummary }: { url: string; aiSummary: any }) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f9f9f9;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <div style="padding: 20px; border-bottom: 1px solid #eee;">
        <h2 style="margin: 0; color: #222;">🎯 Your SEO Report is Ready</h2>
        <p style="margin-top: 8px;">Here's a summary for: <strong>${url}</strong></p>
      </div>
      <div style="padding: 20px;">
        <p><strong>SEO Score:</strong> <span style="font-size: 18px; color: ${aiSummary.score >= 75 ? '#28a745' : '#ffc107'};">${aiSummary.score ?? 'N/A'}</span></p>
        <h3 style="margin-top: 24px;">📝 Summary</h3>
        <p style="margin-top: 8px;">${aiSummary.summary || 'No summary available.'}</p>

        ${
          aiSummary.recommendations?.length
            ? `<h3 style="margin-top: 24px;">🔧 Recommendations</h3>
             <ul>${aiSummary.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}</ul>`
            : ''
        }

        ${
          aiSummary.priorityActions?.length
            ? `<h3 style="margin-top: 24px;">🚀 Priority Actions</h3>
             <ul>${aiSummary.priorityActions.map((item: string) => `<li>${item}</li>`).join('')}</ul>`
            : ''
        }

        <p style="margin-top: 30px; font-size: 12px; color: #888;">
          You’re receiving this email because you requested a free SEO analysis on our platform.
        </p>
      </div>
    </div>
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #aaa;">
      © ${new Date().getFullYear()} BriefUGC · All rights reserved
    </div>
  </div>
  `
