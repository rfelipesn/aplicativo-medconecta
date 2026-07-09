const API = 'http://127.0.0.1:3333';
const PATIENT_ID = '4234469f-d55c-484f-a60f-5f5ce1e3fd12';

async function main() {
  // Login
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dr.exame@medconecta.test', password: 'SenhaExm123' }),
  });
  if (!loginRes.ok) { console.error('login failed', await loginRes.text()); process.exit(1); }
  const { accessToken } = await loginRes.json();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };
  console.log('0) login ok, tokenLen=', accessToken.length);

  // 1. Signed upload URL
  const signRes = await fetch(`${API}/patients/${PATIENT_ID}/exams/sign-upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ examType: 'eeg', filename: 'eeg_test.pdf', mimeType: 'application/pdf' }),
  });
  if (!signRes.ok) { console.error('sign-upload failed', await signRes.text()); process.exit(1); }
  const signed = await signRes.json();
  console.log('1) storagePath=', signed.storagePath);

  // 2. PUT direto no Storage com PDF mínimo
  const pdfContent = new TextEncoder().encode('%PDF-1.4 medconecta e2e exam test '.padEnd(950, 'x'));
  const putRes = await fetch(signed.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf' },
    body: pdfContent,
  });
  console.log('2) PUT Storage:', putRes.status);
  if (!putRes.ok) { console.error('  body:', await putRes.text()); process.exit(1); }

  // 3. Registra no banco
  const regRes = await fetch(`${API}/patients/${PATIENT_ID}/exams`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      storagePath: signed.storagePath,
      examType: 'eeg',
      fileMimeType: 'application/pdf',
      fileSize: pdfContent.length,
      userNotes: 'EEG de rotina e2e',
    }),
  });
  if (!regRes.ok) { console.error('register failed', await regRes.text()); process.exit(1); }
  const { exam } = await regRes.json();
  console.log('3) examId=', exam.id, 'tipo=', exam.examType, 'notas=', exam.userNotes);

  // 4. Lista exames
  const listRes = await fetch(`${API}/patients/${PATIENT_ID}/exams`, { headers });
  const { exams } = await listRes.json();
  console.log('4) total=', exams.length, 'primeiro:', exams[0]?.examType, exams[0]?.userNotes);

  // 5. Download URL
  const dlRes = await fetch(`${API}/patients/${PATIENT_ID}/exams/${exam.id}/download-url`, { headers });
  const { signedUrl, expiresInSeconds } = await dlRes.json();
  console.log('5) download URL ok, expires=', expiresInSeconds, 's  url[:80]=', signedUrl?.slice(0, 80));

  // 6. Sem token deve retornar 401
  const noAuthRes = await fetch(`${API}/patients/${PATIENT_ID}/exams`);
  console.log('6) sem token:', noAuthRes.status, '(esperado 401)');

  console.log('\n=== TODOS OS TESTES PASSARAM ===');
}

main().catch(err => { console.error('Erro:', err); process.exit(1); });
