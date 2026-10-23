import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
import {writeFile,readFile} from 'node:fs/promises';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw new Error('Ce script est réservé au Supabase local.');
const db=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
let accounts;try{accounts=JSON.parse(await readFile('.env.studio-users.local','utf8'));}catch{accounts=[{email:'validateur@studio.local',name:'Validateur',role:'validator',password:randomBytes(18).toString('base64url')},{email:'preparateur@studio.local',name:'Préparateur',role:'preparer',password:randomBytes(18).toString('base64url')}];}
for(const account of accounts){const {data:users,error:listError}=await db.auth.admin.listUsers();if(listError)throw listError;let user=users.users.find(u=>u.email===account.email);if(!user){const {data,error}=await db.auth.admin.createUser({email:account.email,password:account.password,email_confirm:true});if(error)throw error;user=data.user;}const {error}=await db.from('studio_members').upsert({id:user.id,name:account.name,role:account.role});if(error)throw error;}
await writeFile('.env.studio-users.local',JSON.stringify(accounts,null,2),{mode:0o600});
console.log('Deux comptes locaux prêts. Identifiants dans .env.studio-users.local (ignoré par Git).');
