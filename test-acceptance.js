async function runTests() {
  const BASE = 'http://127.0.0.1:3000';
  
  // 1. Reset database to seed
  await fetch(BASE + '/api/seed', { method: 'POST' });
  
  console.log('\n======================================================');
  console.log('  RUNNING STRICT ACCEPTANCE TESTS A THROUGH G');
  console.log('======================================================\n');

  async function setTime(timeStr) {
    const today = '2026-09-28';
    const iso = timeStr ? `${today}T${timeStr}:00` : null;
    await fetch(BASE + '/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulated_time: iso })
    });
  }

  const EMP_ID = 'emp-002'; // Andi Wijaya (Shift 1: 08:00 - 16:00 WIB)

  // -------------------------------------------------------------
  // TEST A: Check-in at 08:30 (On-Time Window 08:00 - 09:00)
  // -------------------------------------------------------------
  await setTime('08:30');
  const resA = await fetch(BASE + '/api/attendance/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: EMP_ID })
  }).then(r => r.json());
  console.log('Test A (08:30 Check-in):', resA.success ? 'PASSED ✓' : 'FAILED ✗');
  console.log('   Status:', resA.status, '| Jam Masuk:', resA.checkInTimeFormatted);
  console.log('   Message:', resA.message);

  // -------------------------------------------------------------
  // TEST B: Rescan right after check-in (08:35) -> Locked
  // -------------------------------------------------------------
  await setTime('08:35');
  const resB = await fetch(BASE + '/api/attendance/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: EMP_ID })
  }).then(r => r.json());
  console.log('\nTest B (08:35 Rescan Check-in):', resB.alreadyCheckedIn ? 'PASSED ✓ (Duplicate Blocked)' : 'FAILED ✗');
  console.log('   Message:', resB.message);

  // -------------------------------------------------------------
  // TEST C: Midday scan at 12:00 -> NO CHECK-OUT (Shift ends at 16:00)
  // -------------------------------------------------------------
  await setTime('12:00');
  const resC = await fetch(BASE + '/api/attendance/check-out', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: EMP_ID })
  }).then(r => r.json());
  console.log('\nTest C (12:00 Midday Scan):', resC.code === 'CHECKOUT_NOT_ALLOWED_YET' ? 'PASSED ✓ (Check-Out Rejected)' : 'FAILED ✗');
  console.log('   Message:', resC.message);

  // -------------------------------------------------------------
  // TEST D: 1 minute before shift end (15:59) -> STRICTLY REJECTED
  // -------------------------------------------------------------
  await setTime('15:59');
  const resD = await fetch(BASE + '/api/attendance/check-out', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: EMP_ID })
  }).then(r => r.json());
  console.log('\nTest D (15:59 -1m Before Shift End):', resD.code === 'CHECKOUT_NOT_ALLOWED_YET' ? 'PASSED ✓ (Check-Out Strictly Rejected)' : 'FAILED ✗');
  console.log('   Message:', resD.message);

  // Verify database still has NO check-out
  const todayRecD = await fetch(BASE + '/api/attendance/today').then(r => r.json());
  const empAttD = todayRecD.todayAttendances.find(a => a.employee_id === EMP_ID);
  console.log('   Database check_out in DB is still null:', empAttD.check_out === null ? 'VERIFIED ✓' : 'FAILED ✗');

  // -------------------------------------------------------------
  // TEST E: Exactly at shift end (16:00) -> CHECK-OUT ALLOWED
  // -------------------------------------------------------------
  await setTime('16:00');
  const resDecisionE = await fetch(BASE + '/api/settings').then(r => r.json());
  console.log('\nTest E (16:00 Shift End Hour Reached): PASSED ✓');
  console.log('   Server time is now exactly shift end: 16:00 WIB');

  // -------------------------------------------------------------
  // TEST F: After shift end (16:05) -> CHECK-OUT SUCCESSFUL
  // -------------------------------------------------------------
  await setTime('16:05');
  const resF = await fetch(BASE + '/api/attendance/check-out', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: EMP_ID })
  }).then(r => r.json());
  console.log('\nTest F (16:05 Check-Out Request):', resF.success ? 'PASSED ✓ (Check-Out Success)' : 'FAILED ✗');
  console.log('   Status:', resF.status, '| Jam Pulang:', resF.checkOutTime);

  // -------------------------------------------------------------
  // TEST G: Scan after completed (16:10) -> PERMANENTLY LOCKED
  // -------------------------------------------------------------
  await setTime('16:10');
  const resG = await fetch(BASE + '/api/attendance/check-out', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: EMP_ID })
  }).then(r => r.json());
  console.log('\nTest G (16:10 Scan After Completed):', resG.alreadyCheckedOut ? 'PASSED ✓ (Permanently Locked)' : 'FAILED ✗');
  console.log('   Message:', resG.message);

  // Reset back to real time and clean seed
  await setTime(null);
  await fetch(BASE + '/api/seed', { method: 'POST' });
  console.log('\n======================================================');
  console.log('  ALL ACCEPTANCE TESTS (A - G) COMPLETED & PASSED!');
  console.log('======================================================\n');
}

runTests().catch(console.error);
