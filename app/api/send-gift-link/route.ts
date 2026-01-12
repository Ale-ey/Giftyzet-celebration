import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import twilio from 'twilio'

const resend = new Resend(process.env.RESEND_API_KEY)

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      method, 
      receiverName, 
      receiverEmail, 
      receiverPhone, 
      senderName,
      giftLink 
    } = body

    if (!giftLink) {
      return NextResponse.json(
        { error: 'Gift link is required' },
        { status: 400 }
      )
    }

    // Send via Email using Resend
    if (method === 'email') {
      if (!receiverEmail) {
        return NextResponse.json(
          { error: 'Receiver email is required for email delivery' },
          { status: 400 }
        )
      }

      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 500 }
        )
      }

      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Gift@giftyzel.com',
        to: receiverEmail,
        subject: `🎁 ${senderName} sent you a gift!`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>You've Received a Gift!</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎁 You've Received a Gift!</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi ${receiverName || 'there'}! 👋</p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Great news! <strong>${senderName}</strong> has sent you a special gift through Giftyzel! 🎉
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 25px 0;">
                  <p style="margin: 0 0 15px 0; font-size: 14px; color: #666;">
                    To receive your gift, please confirm your shipping address by clicking the button below:
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${giftLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                    View Your Gift & Confirm Address
                  </a>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 25px 0;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>⚡ Action Required:</strong> Your gift cannot be shipped until you confirm your delivery address.
                  </p>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="font-size: 12px; color: #667eea; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
                  ${giftLink}
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
                  This is an automated message from Giftyzel. If you didn't expect this gift, you can safely ignore this email.
                </p>
              </div>
            </body>
          </html>
        `,
      })

      if (error) {
        console.error('Resend error:', error)
        return NextResponse.json(
          { error: 'Failed to send email', details: error },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        method: 'email',
        messageId: data?.id 
      })
    }

    // Send via SMS using Twilio
    if (method === 'sms') {
      if (!receiverPhone) {
        return NextResponse.json(
          { error: 'Receiver phone number is required for SMS delivery' },
          { status: 400 }
        )
      }

      if (!twilioClient) {
        return NextResponse.json(
          { error: 'SMS service not configured' },
          { status: 500 }
        )
      }

      const message = await twilioClient.messages.create({
        body: `🎁 Hi ${receiverName || 'there'}! ${senderName} sent you a gift! Click here to confirm your shipping address and view your gift: ${giftLink}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: receiverPhone,
      })

      return NextResponse.json({ 
        success: true, 
        method: 'sms',
        messageId: message.sid 
      })
    }

    // Copy Link - no action needed, just return success
    if (method === 'copy') {
      return NextResponse.json({ 
        success: true, 
        method: 'copy',
        message: 'Link ready to copy'
      })
    }

    return NextResponse.json(
      { error: 'Invalid delivery method' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Error sending gift link:', error)
    return NextResponse.json(
      { error: 'Failed to send gift link', details: error.message },
      { status: 500 }
    )
  }
}
