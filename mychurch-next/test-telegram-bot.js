// Test Telegram bot directly
const BOT_TOKEN = '8649518959:AAE91lunLA_AiNF_8AsXG_cIbOLBuD28skI';
const CHAT_ID = '6884751491';

async function testBot() {
  console.log('🤖 Testing Telegram Bot...');
  console.log('Bot Token prefix:', BOT_TOKEN.slice(0, 15) + '...');
  console.log('Target Chat ID:', CHAT_ID);
  
  // 1. First check if bot is valid
  const meRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
  const me = await meRes.json();
  console.log('\n📡 Bot info:', JSON.stringify(me, null, 2));
  
  if (!me.ok) {
    console.error('❌ Bot token is INVALID!');
    return;
  }
  
  // 2. Try sending a message
  console.log('\n📨 Attempting to send message...');
  const sendRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: '✅ تست موفق! ربات MyChurch به درستی متصل است.\n\nTest successful! MyChurch bot is connected.',
      parse_mode: 'HTML'
    })
  });
  
  const sendResult = await sendRes.json();
  console.log('Send result:', JSON.stringify(sendResult, null, 2));
  
  if (sendResult.ok) {
    console.log('\n🎉 SUCCESS! Message sent to Telegram!');
  } else {
    console.log('\n❌ FAILED! Error code:', sendResult.error_code);
    console.log('Description:', sendResult.description);
    
    if (sendResult.error_code === 403) {
      console.log('\n💡 FIX: The user has NOT started the bot yet.');
      console.log('   → Go to Telegram, find the bot @' + me.result?.username);
      console.log('   → Press START or type /start');
    } else if (sendResult.error_code === 400) {
      console.log('\n💡 FIX: Chat ID might be wrong.');
      console.log('   → Get your correct Chat ID from @userinfobot');
    }
  }
}

testBot().catch(console.error);
