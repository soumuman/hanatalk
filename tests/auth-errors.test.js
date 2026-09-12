import test from 'node:test';
import assert from 'node:assert/strict';
import {emailFailureMessage} from '../js/cloud/auth-errors.js';
test('email failures distinguish limits, configuration and connection without exposing private messages',()=>{
 assert.match(emailFailureMessage({code:'over_email_send_rate_limit',status:429}),/上限/);
 assert.match(emailFailureMessage({code:'email_address_not_authorized',status:403}),/許可されていません/);
 assert.match(emailFailureMessage({name:'AbortError'}),/接続できません/);
 assert.match(emailFailureMessage({status:500}),/認証ログ/);
 assert.ok(!emailFailureMessage({code:'private@example.test',message:'private@example.test token=secret',status:400}).includes('private'));
});
