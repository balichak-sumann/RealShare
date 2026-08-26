/**
 * Generates a premium HTML welcome email for new RealShare employees.
 */
export function getWelcomeEmailHTML({
  employeeName,
  employeeId,
  email,
  tempPassword,
  department,
  loginUrl,
}: {
  employeeName: string;
  employeeId: string;
  email: string;
  tempPassword: string;
  department: string;
  loginUrl: string;
}): string {
  const deptColor =
    department.toLowerCase() === 'sales'
      ? '#2563EB'
      : department.toLowerCase() === 'support'
        ? '#D97706'
        : '#059669';
  const deptBg =
    department.toLowerCase() === 'sales'
      ? '#EFF6FF'
      : department.toLowerCase() === 'support'
        ? '#FEF3C7'
        : '#ECFDF5';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to RealShare</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 32px 40px; text-align: center;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <table cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 36px; height: 36px; background: linear-gradient(135deg, #2563EB, #3B82F6); border-radius: 10px; text-align: center; vertical-align: middle; color: #FFFFFF; font-weight: 700; font-size: 18px;">◆</td>
                        <td style="padding-left: 12px; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">RealShare</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 8px; color: #94A3B8; font-size: 13px; text-align: center; letter-spacing: 0.5px;">EMPLOYEE PORTAL</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- WELCOME BANNER -->
          <tr>
            <td style="padding: 40px 40px 16px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px;">Welcome to the Team!</h1>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0 0 12px; font-size: 15px; color: #475569; line-height: 1.7;">
                Dear <strong style="color: #0F172A;">${employeeName}</strong>,
              </p>
              <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7;">
                We're thrilled to have you join the <strong>RealShare</strong> family! Your employee account has been created and you're all set to get started. Below are your login credentials to access the Employee Portal.
              </p>
            </td>
          </tr>

          <!-- CREDENTIALS CARD -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background: linear-gradient(135deg, #1E40AF, #3B82F6); padding: 14px 24px;">
                    <span style="color: #FFFFFF; font-size: 14px; font-weight: 700; letter-spacing: 0.5px;">🔐 YOUR LOGIN CREDENTIALS</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 24px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
                          <span style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">Employee ID</span>
                          <div style="font-size: 16px; font-weight: 700; color: #0F172A; font-family: 'Courier New', monospace; margin-top: 4px;">${employeeId}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
                          <span style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">Email Address</span>
                          <div style="font-size: 15px; font-weight: 600; color: #0F172A; margin-top: 4px;">${email}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
                          <span style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">Temporary Password</span>
                          <div style="font-size: 16px; font-weight: 700; color: #DC2626; font-family: 'Courier New', monospace; margin-top: 4px; background: #FEF2F2; display: inline-block; padding: 4px 12px; border-radius: 6px;">${tempPassword}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">Department</span>
                          <div style="margin-top: 4px;">
                            <span style="display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 700; background: ${deptBg}; color: ${deptColor};">${department}</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td style="padding: 0 40px 24px; text-align: center;">
              <a href="${loginUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #1E40AF, #3B82F6); color: #FFFFFF; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                Login to Your Portal →
              </a>
            </td>
          </tr>

          <!-- SECURITY WARNING -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px;">
                <tr>
                  <td style="padding: 14px 20px;">
                    <span style="font-size: 14px; color: #92400E; font-weight: 600;">
                      ⚠️ <strong>Security Notice:</strong> For your safety, please change your temporary password immediately after your first login.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- WHAT'S NEXT -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #0F172A;">📋 What's Next?</h3>
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9;">
                    <table cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 32px; height: 32px; background: #EFF6FF; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 14px;">1️⃣</td>
                        <td style="padding-left: 12px; font-size: 14px; color: #334155; font-weight: 500;">Complete your employee profile with photo & documents</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9;">
                    <table cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 32px; height: 32px; background: #FEF3C7; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 14px;">2️⃣</td>
                        <td style="padding-left: 12px; font-size: 14px; color: #334155; font-weight: 500;">Review your assigned targets & KPIs for this month</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <table cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 32px; height: 32px; background: #ECFDF5; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 14px;">3️⃣</td>
                        <td style="padding-left: 12px; font-size: 14px; color: #334155; font-weight: 500;">Connect with your team lead & start onboarding</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: #0F172A; padding: 28px 40px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748B;">
                © ${new Date().getFullYear()} RealShare | IndusInnovate Technologies Pvt. Ltd.
              </p>
              <p style="margin: 0; font-size: 12px; color: #475569;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
