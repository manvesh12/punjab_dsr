/* User management */
const USER_ROLE_OPTIONS = [
  'IIT_ROPAR', 'SDO', 'JE', 'AXEN', 'GIS',
  'REVIEWER_1', 'REVIEWER_2', 'ADMIN', 'OFFICER', 'DATA_ENTRY', 'REVIEWER'
];
function usersBadge(ok) {
  return ok
    ? '<span class="badge badge-green">Yes</span>'
    : '<span class="badge badge-red">No</span>';
}
function formatUserScope(user) {
  const parts = [];
  if (user.district) parts.push(user.district);
  if (user.block) parts.push(user.block);
  if (user.section) parts.push(user.section);
  return parts.length ? parts.join(' / ') : 'All';
}
async function renderUsers() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  if (typeof hasAdminAccess === 'function' && !hasAdminAccess()) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Only Admin can manage users.</td></tr>';
    return;
  }
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading users...</td></tr>';
  try {
    const users = await apiFetch('/users');
    window.cachedUsers = users;
    tbody.innerHTML = users.map(user => {
      const perms = user.permissions || [];
      const activeLabel = user.active ? '<span class="badge badge-green">Active</span>' : '<span class="badge badge-gray">Inactive</span>';
      return `
        <tr>
          <td>
            <div style="font-weight:700; display:flex; align-items:center; gap:4px;">
              ${user.email || user.username}
              <i data-lucide="check-circle-2" style="width:14px;height:14px;color:#10B981;" title="Email Sent"></i>
            </div>
            <div style="font-size:11px;color:var(--text-soft);">${user.fullName || ''}</div>
          </td>
          <td>${renderRoleSelect(user)}</td>
          <td>${usersBadge(perms.includes('UPLOAD'))}</td>
          <td>${usersBadge(perms.includes('REVIEW'))}</td>
          <td>${user.accessLabel || '-'}</td>
          <td>${formatUserScope(user)}</td>
          <td>${activeLabel}</td>
          <td style="display:flex;gap:6px;align-items:center;">
            <button class="btn btn-xs btn-outline" onclick="editUserScope(${user.id})">Scope</button>
            <button class="btn btn-xs ${user.active ? 'btn-danger' : 'btn-saffron'}" onclick="toggleUserActive(${user.id}, ${!user.active})">${user.active ? 'Disable' : 'Enable'}</button>
            ${!user.active ? `<button class="btn btn-xs btn-danger" onclick="deleteUserPermanently(${user.id}, '${user.email || user.username}')">Delete</button>` : ''}
          </td>
        </tr>`;
    }).join('');
    if (window.initLucide) window.initLucide();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--red);">${e.message || 'Failed to load users'}</td></tr>`;
  }
}
function renderRoleSelect(user) {
  const options = USER_ROLE_OPTIONS.map(role => `<option value="${role}" ${role === user.role ? 'selected' : ''}>${role.replace(/_/g, ' ')}</option>`).join('');
  return `<select style="min-width:150px;" onchange="updateUserRole(${user.id}, this.value)">${options}</select>`;
}
async function updateUserRole(userId, role) {
  try {
    await apiFetch(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
    toast('Role updated', 'success');
    renderUsers();
  } catch (e) {
    toast(e.message || 'Failed to update role', 'error');
  }
}
async function toggleUserActive(userId, active) {
  try {
    const updatedUser = await apiFetch(`/users/${userId}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ active })
    });
    toast(active ? 'User enabled' : 'User disabled', 'success');
    
    if (window.cachedUsers) {
      const idx = window.cachedUsers.findIndex(u => u.id === userId);
      if (idx !== -1) {
        window.cachedUsers[idx].active = active;
        renderUsersFromCache();
        return;
      }
    }
    renderUsers();
  } catch (e) {
    toast(e.message || 'Failed to update user', 'error');
  }
}

function renderUsersFromCache() {
  const users = window.cachedUsers || [];
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  tbody.innerHTML = users.map(user => {
    const perms = user.permissions || [];
    const activeLabel = user.active ? '<span class="badge badge-green">Active</span>' : '<span class="badge badge-gray">Inactive</span>';
    return `
      <tr>
        <td>
          <div style="font-weight:700; display:flex; align-items:center; gap:4px;">
            ${user.email || user.username}
            <i data-lucide="check-circle-2" style="width:14px;height:14px;color:#10B981;" title="Email Sent"></i>
          </div>
          <div style="font-size:11px;color:var(--text-soft);">${user.fullName || ''}</div>
        </td>
        <td>${renderRoleSelect(user)}</td>
        <td>${usersBadge(perms.includes('UPLOAD'))}</td>
        <td>${usersBadge(perms.includes('REVIEW'))}</td>
        <td>${user.accessLabel || '-'}</td>
        <td>${formatUserScope(user)}</td>
        <td>${activeLabel}</td>
        <td style="display:flex;gap:6px;align-items:center;">
          <button class="btn btn-xs btn-outline" onclick="editUserScope(${user.id})">Scope</button>
          <button class="btn btn-xs ${user.active ? 'btn-danger' : 'btn-saffron'}" onclick="toggleUserActive(${user.id}, ${!user.active})">${user.active ? 'Disable' : 'Enable'}</button>
          ${!user.active ? `<button class="btn btn-xs btn-danger" onclick="deleteUserPermanently(${user.id}, '${user.email || user.username}')">Delete</button>` : ''}
        </td>
      </tr>`;
  }).join('');
  if (window.initLucide) window.initLucide();
}
async function deleteUserPermanently(userId, email) {
  if (!confirm(`Are you sure you want to permanently delete user "${email}" from the project? This action cannot be undone.`)) {
    return;
  }
  try {
    await apiFetch(`/users/${userId}`, {
      method: 'DELETE'
    });
    toast('User permanently deleted', 'success');
    renderUsers();
  } catch (e) {
    toast(e.message || 'Failed to delete user', 'error');
  }
}
window.deleteUserPermanently = deleteUserPermanently;

function editUserScope(userId) {
  const user = (window.cachedUsers || []).find(u => u.id === userId);
  if (!user) return;
  document.getElementById('edit-scope-user-id').value = userId;
  hydrateDistrictSelect('edit-scope-district', true);
  const districtSelect = document.getElementById('edit-scope-district');
  districtSelect.insertAdjacentHTML('afterbegin', '<option value="">Global / State Admin only</option>');
  districtSelect.value = user.district || '';
  document.getElementById('edit-scope-block').value = user.block || '';
  document.getElementById('edit-scope-section').value = user.section || '';
  openModal('modal-edit-scope');
}

async function submitUserScope() {
  const userId = document.getElementById('edit-scope-user-id').value;
  const district = document.getElementById('edit-scope-district').value.trim();
  const block = document.getElementById('edit-scope-block').value.trim();
  const section = document.getElementById('edit-scope-section').value.trim();
  try {
    await apiFetch(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ district, block, section })
    });
    toast('Scope updated', 'success');
    closeModal('modal-edit-scope');
    renderUsers();
  } catch (e) {
    toast(e.message || 'Failed to update scope', 'error');
  }
}
window.submitUserScope = submitUserScope;

function openAddUserPrompt() {
  hydrateDistrictSelect('invite-single-district', true);
  openModal('modal-invite-user');
}

async function doSingleInvite() {
  const email = document.getElementById('invite-single-email').value.trim();
  const role = document.getElementById('invite-single-role').value;
  const fullName = document.getElementById('invite-single-name')?.value.trim() || '';
  const department = document.getElementById('invite-single-department')?.value.trim() || '';
  const designation = document.getElementById('invite-single-designation')?.value.trim() || '';
  const state = document.getElementById('invite-single-state')?.value.trim() || 'Punjab';
  const district = document.getElementById('invite-single-district')?.value.trim() || '';
  const mobileNumber = document.getElementById('invite-single-mobile')?.value.trim() || '';
  if (!email) {
    toast('Please enter an email address', 'error');
    return;
  }
  if (!district) {
    toast('Please select the user district', 'error');
    return;
  }
  try {
    await apiFetch('/users/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role, fullName, department, designation, state, district, mobileNumber })
    });
    toast(`Invitation sent to ${email}`, 'success');
    closeModal('modal-invite-user');
    ['invite-single-name', 'invite-single-email', 'invite-single-department', 'invite-single-designation', 'invite-single-district', 'invite-single-mobile'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const stateEl = document.getElementById('invite-single-state');
    if (stateEl) stateEl.value = 'Punjab';
  } catch (e) {
    toast(e.message || 'Failed to send invitation', 'error');
  }
}

async function downloadUserExcel(path, filename) {
  try {
    const token = localStorage.getItem('dsr_token');
    const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Could not generate the Excel file');
    }
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    toast(error.message || 'Excel download failed', 'error');
  }
}
function downloadBulkInviteTemplate() {
  return downloadUserExcel('/users/invite-template', 'district-user-invitation-template.xlsx');
}
function downloadDistrictUserRoster() {
  return downloadUserExcel('/users/export', 'district-user-login-roster.xlsx');
}

async function doBulkInvite() {
  const fileInput = document.getElementById('bulk-invite-file');
  if (!fileInput.files || fileInput.files.length === 0) {
    toast('Please select a file to upload', 'error');
    return;
  }
  
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  
  const btn = document.querySelector('button[onclick="doBulkInvite()"]');
  const originalText = btn ? btn.innerText : 'Upload & Process';
  if (btn) {
    btn.innerText = 'Processing... Please wait';
    btn.disabled = true;
  }
  
  try {
    const token = localStorage.getItem('dsr_token');
    const res = await fetch(`${API_BASE_URL}/users/invite/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    // reset button before processing response
    if (btn) {
      btn.innerText = originalText;
      btn.disabled = false;
    }
    
    let data;
    try {
      data = await res.json();
    } catch(err) {
      throw new Error('Server is restarting or returned invalid response. Please try again in 1-2 minutes.');
    }
    
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    
    closeModal('modal-bulk-invite');
    fileInput.value = '';
    
    // Show results modal
    document.getElementById('bulk-res-success').textContent = data.successCount;
    document.getElementById('bulk-res-failed').textContent = data.failedCount;
    
    const errorsBody = document.getElementById('bulk-errors-body');
    errorsBody.innerHTML = '';
    if (data.errors && data.errors.length > 0) {
      document.getElementById('bulk-errors-container').style.display = 'block';
      data.errors.forEach(err => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${err.row}</td>
          <td>${err.email || 'N/A'}</td>
          <td style="color:var(--text-soft); font-size:12px;">${err.reason}</td>
        `;
        errorsBody.appendChild(tr);
      });
    } else {
      document.getElementById('bulk-errors-container').style.display = 'none';
    }
    
    openModal('modal-bulk-invite-results');
    renderUsers();
  } catch (e) {
    if (btn) {
      btn.innerText = originalText;
      btn.disabled = false;
    }
    toast(e.message || 'Failed to process bulk upload', 'error');
  }
}

window.renderUsers = renderUsers;
window.downloadDistrictUserRoster = downloadDistrictUserRoster;
window.updateUserRole = updateUserRole;
window.toggleUserActive = toggleUserActive;
window.editUserScope = editUserScope;
window.openAddUserPrompt = openAddUserPrompt;
window.doSingleInvite = doSingleInvite;
window.downloadBulkInviteTemplate = downloadBulkInviteTemplate;
window.doBulkInvite = doBulkInvite;

let invitedOtpTimer = null;
let invitedOtpSeconds = 600;
let invitedResendSeconds = 60;

function updateInvitedOtpMeta() {
  const meta = document.getElementById('invited-otp-meta');
  const resendBtn = document.getElementById('invited-resend-btn');
  const mm = String(Math.floor(invitedOtpSeconds / 60)).padStart(2, '0');
  const ss = String(invitedOtpSeconds % 60).padStart(2, '0');
  if (meta) meta.textContent = `OTP expires in ${mm}:${ss}`;
  if (resendBtn) {
    resendBtn.disabled = invitedResendSeconds > 0;
    resendBtn.textContent = invitedResendSeconds > 0 ? `Resend OTP in ${invitedResendSeconds}s` : 'Resend OTP';
  }
}

function startInvitedOtpTimer(expiresInSeconds = 600, resendCooldownSeconds = 60) {
  invitedOtpSeconds = Number(expiresInSeconds || 600);
  invitedResendSeconds = Number(resendCooldownSeconds || 60);
  if (invitedOtpTimer) clearInterval(invitedOtpTimer);
  updateInvitedOtpMeta();
  invitedOtpTimer = setInterval(() => {
    invitedOtpSeconds = Math.max(0, invitedOtpSeconds - 1);
    invitedResendSeconds = Math.max(0, invitedResendSeconds - 1);
    updateInvitedOtpMeta();
    if (invitedOtpSeconds === 0 && invitedResendSeconds === 0) clearInterval(invitedOtpTimer);
  }, 1000);
}

function invitedPasswordIsStrong(password) {
  return password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
}

async function doInvitedRegister() {
  const token = new URLSearchParams(window.location.search).get('invite');
  const fullName = document.getElementById('invited-name').value.trim();
  const mobileNumber = document.getElementById('invited-mobile').value.trim();
  const password = document.getElementById('invited-pass').value;
  const employeeId = document.getElementById('invited-employee-id')?.value.trim() || '';
  const gender = document.getElementById('invited-gender')?.value || '';
  const acceptedTerms = Boolean(document.getElementById('invited-terms')?.checked);

  if (!fullName || !mobileNumber || !password) {
    document.getElementById('invited-error').textContent = 'All fields are required';
    document.getElementById('invited-error').style.display = 'block';
    return;
  }
  if (!invitedPasswordIsStrong(password)) {
    document.getElementById('invited-error').textContent = 'Password must be at least 12 characters and include uppercase, lowercase, number and special character.';
    document.getElementById('invited-error').style.display = 'block';
    return;
  }
  if (!acceptedTerms) {
    document.getElementById('invited-error').textContent = 'Please accept the terms and conditions.';
    document.getElementById('invited-error').style.display = 'block';
    return;
  }

  try {
    const btn = document.getElementById('invited-btn-submit');
    const oldText = btn.innerHTML;
    btn.innerHTML = 'Registering...';

    const res = await fetch('/api/auth/register-invited', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, fullName, mobileNumber, password, employeeId, gender, acceptedTerms })
    });
    
    const data = await res.json();
    btn.innerHTML = oldText;

    if (!res.ok) throw new Error(data.error || 'Failed to register');

    if (data.requiresOtp) {
      document.getElementById('invited-error').style.display = 'none';
      document.getElementById('invited-success').textContent = "OTP sent to your email address.";
      document.getElementById('invited-success').style.display = 'block';
      
      document.getElementById('invited-btn-submit').style.display = 'none';
      document.getElementById('invited-otp-section').style.display = 'block';
      startInvitedOtpTimer(data.expiresInSeconds || 600, data.resendCooldownSeconds || 60);
    } else {
      // Direct login fallback
      localStorage.setItem('dsr_token', data.token);
      localStorage.setItem('dsr_user', JSON.stringify(data));
      window.location.href = 'index.html';
    }
  } catch (e) {
    document.getElementById('invited-error').textContent = e.message;
    document.getElementById('invited-error').style.display = 'block';
  }
}

async function doVerifyInvitedOtp() {
  const token = new URLSearchParams(window.location.search).get('invite');
  const otp = document.getElementById('invited-otp').value.trim();

  if (!otp || otp.length !== 6) {
    document.getElementById('invited-error').textContent = 'Please enter a valid 6-digit OTP';
    document.getElementById('invited-error').style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/auth/verify-invited-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, otp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');

    localStorage.setItem('dsr_token', data.token);
    localStorage.setItem('dsr_user', JSON.stringify(data));
    
    window.location.href = 'index.html';
  } catch (e) {
    document.getElementById('invited-error').textContent = e.message;
    document.getElementById('invited-error').style.display = 'block';
  }
}

async function doResendInvitedOtp() {
  const token = new URLSearchParams(window.location.search).get('invite');
  try {
    const btn = document.getElementById('invited-resend-btn');
    if (btn) btn.disabled = true;
    const res = await fetch('/api/auth/resend-invited-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not resend OTP');
    document.getElementById('invited-success').textContent = data.message || 'OTP resent to your invited email address.';
    document.getElementById('invited-success').style.display = 'block';
    startInvitedOtpTimer(data.expiresInSeconds || 600, data.resendCooldownSeconds || 60);
  } catch (e) {
    document.getElementById('invited-error').textContent = e.message;
    document.getElementById('invited-error').style.display = 'block';
    updateInvitedOtpMeta();
  }
}

window.doInvitedRegister = doInvitedRegister;
window.doVerifyInvitedOtp = doVerifyInvitedOtp;
window.doResendInvitedOtp = doResendInvitedOtp;

// Initialization logic for invites
setTimeout(async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('invite');
  if (token && document.getElementById('auth-form-invited')) {
    // Hide all auth forms
    document.querySelectorAll('.auth-form').forEach(el => el.style.display = 'none');
    document.querySelector('.auth-tabs').style.display = 'none';
    
    document.getElementById('auth-form-invited').style.display = 'block';

    try {
      const res = await fetch(`/api/auth/invitation/${token}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid link');

      document.getElementById('invited-email').value = data.email;
      if (data.fullName) document.getElementById('invited-name').value = data.fullName;
      if (data.mobileNumber) document.getElementById('invited-mobile').value = data.mobileNumber;
      document.getElementById('invited-subtext').textContent = `You have been invited as ${data.role}. Please complete your profile.`;
    } catch (e) {
      document.getElementById('invited-error').textContent = e.message;
      document.getElementById('invited-error').style.display = 'block';
      document.getElementById('invited-btn-submit').style.display = 'none';
    }
  }
}, 500);

;
