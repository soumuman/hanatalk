// Show only curated messages and safe identifiers, never raw server messages.
export function emailFailureMessage(error){
 const code=typeof error?.code==='string'&&/^[a-z_]{1,64}$/.test(error.code)?error.code:'';
 const status=Number.isInteger(error?.status)&&error.status>=400&&error.status<=599?error.status:null;
 const messages={
  over_email_send_rate_limit:'メール送信の上限に達しています。連続で再送せず、時間を置いてからお試しください。',
  over_request_rate_limit:'短時間の操作回数が上限に達しています。しばらく待ってからお試しください。',
  email_address_not_authorized:'このアドレスへの送信は、Supabaseの標準メール設定で許可されていません。送信サービスの設定が必要です。',
  email_address_invalid:'メールアドレスの形式を確認してください。',
  otp_disabled:'メールリンクによるログインが無効になっています。認証設定の確認が必要です。',
  signup_disabled:'新規登録が無効になっています。認証設定の確認が必要です。',
  captcha_failed:'認証サービスの追加確認に対応できていません。設定の確認が必要です。',
  unexpected_failure:'認証サービスで送信処理に失敗しました。メール送信設定と認証ログの確認が必要です。'
 };
 const message=messages[code]||(status===429?'送信・操作回数が制限されています。時間を置いてからお試しください。':status>=500?'認証サービスでエラーが発生しました。メール送信設定と認証ログの確認が必要です。':!status?'認証サーバーに接続できませんでした。通信状態を確認してください。':'ログイン用メールを送れませんでした。表示された確認番号をお知らせください。');
 return message+'（確認番号：'+[code||'connection',status].filter(Boolean).join(' / ')+'）';
}
