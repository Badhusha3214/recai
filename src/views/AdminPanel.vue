<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <!-- Top bar -->
    <header class="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm">A</div>
        <div>
          <h1 class="text-lg font-bold leading-none text-white">Admin Panel</h1>
          <p class="text-xs text-gray-500 mt-0.5">Echobit management console</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-500">{{ adminEmail }}</span>
        <router-link to="/dashboard" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition">← Dashboard</router-link>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <!-- Error banner -->
      <div v-if="globalError" class="bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
        <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
        {{ globalError }}
      </div>

      <!-- Tabs -->
      <nav class="flex gap-1 bg-gray-900 rounded-xl p-1 w-fit">
        <button
          v-for="tab in tabs" :key="tab.id"
          @click="activeTab = tab.id"
          :class="['px-4 py-2 rounded-lg text-sm font-medium transition', activeTab === tab.id ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800']"
        >{{ tab.label }}</button>
      </nav>

      <!-- ── OVERVIEW ──────────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'overview'">
        <div v-if="statsLoading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="i in 8" :key="i" class="h-24 bg-gray-800 rounded-2xl animate-pulse"></div>
        </div>
        <template v-else-if="stats">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Users"      :value="stats.users.total"          color="violet" icon="users" />
            <StatCard label="Verified"         :value="stats.users.verified"        color="green"  icon="check" />
            <StatCard label="Privacy Accepted" :value="stats.users.privacyAccepted" color="blue"   icon="shield" />
            <StatCard label="New Today"        :value="stats.users.today"           color="yellow" icon="plus" />
            <StatCard label="Total Recordings" :value="stats.recordings.total"      color="violet" icon="mic" />
            <StatCard label="Transcribed"      :value="stats.recordings.transcribed" color="green" icon="text" />
            <StatCard label="Recordings Today" :value="stats.recordings.today"      color="blue"   icon="clock" />
            <StatCard label="This Week"        :value="stats.recordings.week"       color="yellow" icon="calendar" />
          </div>
        </template>

        <!-- Activity Feed -->
        <div class="bg-gray-900 rounded-2xl border border-gray-800">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 class="font-semibold text-white">Recent Activity</h2>
            <button @click="loadActivity" class="text-xs text-violet-400 hover:text-violet-300 transition">Refresh</button>
          </div>
          <div v-if="activityLoading" class="p-5 space-y-3">
            <div v-for="i in 6" :key="i" class="h-10 bg-gray-800 rounded-xl animate-pulse"></div>
          </div>
          <div v-else-if="activity.length === 0" class="px-5 py-10 text-center text-gray-500 text-sm">No activity yet.</div>
          <ul v-else class="divide-y divide-gray-800">
            <li v-for="(ev, i) in activity" :key="i" class="px-5 py-3 flex items-start gap-3">
              <span :class="['mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0', ev.type === 'register' ? 'bg-violet-900 text-violet-300' : 'bg-blue-900 text-blue-300']">
                <svg v-if="ev.type === 'register'" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z"/></svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-200 truncate">{{ ev.text }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs text-gray-500">{{ fmtDate(ev.timestamp) }}</span>
                  <span v-if="ev.type === 'register' && !ev.verified" class="text-xs px-1.5 py-0.5 rounded bg-yellow-900/50 text-yellow-400">unverified</span>
                  <span v-if="ev.type === 'register' && !ev.privacyAccepted" class="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-400">no consent</span>
                  <span v-if="ev.status" :class="['text-xs px-1.5 py-0.5 rounded', statusClass(ev.status)]">{{ ev.status }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- ── USERS ─────────────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'users'" class="space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input v-model="userSearch" @input="debouncedUserSearch" type="text" placeholder="Search name or email…"
            class="w-full sm:w-72 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
          <span class="text-sm text-gray-500">{{ userTotal }} users</span>
        </div>

        <div class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div v-if="usersLoading" class="p-5 space-y-3">
            <div v-for="i in 5" :key="i" class="h-12 bg-gray-800 rounded-xl animate-pulse"></div>
          </div>
          <div v-else-if="users.length === 0" class="px-5 py-10 text-center text-gray-500 text-sm">No users found.</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-800 text-left">
                  <th class="px-4 py-3 text-xs text-gray-500 font-medium">User</th>
                  <th class="px-4 py-3 text-xs text-gray-500 font-medium">Status</th>
                  <th class="px-4 py-3 text-xs text-gray-500 font-medium">Privacy</th>
                  <th class="px-4 py-3 text-xs text-gray-500 font-medium">Recordings</th>
                  <th class="px-4 py-3 text-xs text-gray-500 font-medium">Joined</th>
                  <th class="px-4 py-3 text-xs text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800">
                <tr v-for="u in users" :key="u._id" class="hover:bg-gray-800/50 transition cursor-pointer" @click="openUser(u)">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-violet-900 text-violet-300 flex items-center justify-center text-xs font-bold shrink-0">{{ initials(u.name) }}</div>
                      <div>
                        <p class="font-medium text-white leading-none">{{ u.name }}</p>
                        <p class="text-xs text-gray-400 mt-0.5">{{ u.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span :class="['text-xs px-2 py-1 rounded-full font-medium', u.isVerified ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400']">
                      {{ u.isVerified ? 'Verified' : 'Unverified' }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span :class="['text-xs px-2 py-1 rounded-full font-medium', u.privacyAccepted ? 'bg-blue-900/50 text-blue-400' : 'bg-red-900/50 text-red-400']">
                      {{ u.privacyAccepted ? 'Accepted' : 'Pending' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-300">{{ u.recordingCount }}</td>
                  <td class="px-4 py-3 text-xs text-gray-400">{{ fmtDate(u.createdAt) }}</td>
                  <td class="px-4 py-3" @click.stop>
                    <button @click="confirmDeleteUser(u)" class="text-xs px-2.5 py-1 rounded-lg bg-red-900/40 text-red-400 hover:bg-red-800/60 transition">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div v-if="userPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <button @click="userPage--; loadUsers()" :disabled="userPage <= 1" class="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 transition">← Prev</button>
            <span class="text-xs text-gray-500">Page {{ userPage }} / {{ userPages }}</span>
            <button @click="userPage++; loadUsers()" :disabled="userPage >= userPages" class="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 transition">Next →</button>
          </div>
        </div>
      </div>

      <!-- ── RECORDINGS ─────────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'recordings'" class="space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input v-model="recSearch" @input="debouncedRecSearch" type="text" placeholder="Search title…"
            class="w-full sm:w-72 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
          <span class="text-sm text-gray-500">{{ recTotal }} recordings</span>
        </div>

        <div class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div v-if="recsLoading" class="p-5 space-y-3">
            <div v-for="i in 5" :key="i" class="h-12 bg-gray-800 rounded-xl animate-pulse"></div>
          </div>
          <div v-else-if="recordings.length === 0" class="px-5 py-10 text-center text-gray-500 text-sm">No recordings found.</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-800 text-left">
                  <th class="px-4 py-3 text-xs text-gray-500 font-medium">Title</th>
                  <th class="px-4 py-3 text-xs text-gray-500 font-medium">Owner</th>
                  <th class="px-4 py-3 text-xs text-gray-500 font-medium">Duration</th>
                  <th class="px-4 py-3 text-xs text-gray-500 font-medium">Status</th>
                  <th class="px-4 py-3 text-xs text-gray-500 font-medium">Size</th>
                  <th class="px-4 py-3 text-xs text-gray-500 font-medium">Created</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800">
                <tr v-for="r in recordings" :key="r._id" class="hover:bg-gray-800/50 transition">
                  <td class="px-4 py-3 font-medium text-white max-w-[200px] truncate">{{ r.title }}</td>
                  <td class="px-4 py-3">
                    <div v-if="r.user">
                      <p class="text-gray-200 leading-none">{{ r.user.name }}</p>
                      <p class="text-xs text-gray-500 mt-0.5">{{ r.user.email }}</p>
                    </div>
                    <span v-else class="text-gray-500">—</span>
                  </td>
                  <td class="px-4 py-3 text-gray-300">{{ fmtDuration(r.duration) }}</td>
                  <td class="px-4 py-3">
                    <span :class="['text-xs px-2 py-1 rounded-full font-medium', statusClass(r.status)]">{{ r.status }}</span>
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-400">{{ fmtBytes(r.audioSize) }}</td>
                  <td class="px-4 py-3 text-xs text-gray-400">{{ fmtDate(r.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="recPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <button @click="recPage--; loadRecordings()" :disabled="recPage <= 1" class="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 transition">← Prev</button>
            <span class="text-xs text-gray-500">Page {{ recPage }} / {{ recPages }}</span>
            <button @click="recPage++; loadRecordings()" :disabled="recPage >= recPages" class="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 transition">Next →</button>
          </div>
        </div>
      </div>

      <!-- ── ANALYTICS ───────────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'analytics'" class="space-y-5">
        <!-- Period selector -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-400">Period:</span>
          <button v-for="d in [7, 14, 30, 60, 90]" :key="d"
            @click="analyticsDays = d; loadAnalytics()"
            :class="['px-3 py-1 rounded-lg text-xs font-medium transition', analyticsDays === d ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white']"
          >{{ d }}d</button>
        </div>

        <div v-if="analyticsLoading" class="space-y-4">
          <div v-for="i in 5" :key="i" class="h-36 bg-gray-800 rounded-2xl animate-pulse"></div>
        </div>

        <template v-else-if="analytics">
          <!-- KPI row -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p class="text-xs text-gray-500 mb-1">Total Audio</p>
              <p class="text-2xl font-bold text-white">{{ fmtHours(analytics.totalDuration) }}<span class="text-sm text-gray-500 font-normal ml-1">hrs</span></p>
              <p class="text-xs text-gray-500 mt-1">across all recordings</p>
            </div>
            <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p class="text-xs text-gray-500 mb-1">Storage Used</p>
              <p class="text-2xl font-bold text-white">{{ fmtGB(analytics.totalSize) }}<span class="text-sm text-gray-500 font-normal ml-1">GB</span></p>
              <p class="text-xs text-gray-500 mt-1">total audio files</p>
            </div>
            <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p class="text-xs text-gray-500 mb-1">Privacy Consent</p>
              <p class="text-2xl font-bold text-white">{{ analytics.privacyConsentRate }}<span class="text-sm text-gray-500 font-normal ml-1">%</span></p>
              <p class="text-xs text-gray-500 mt-1">of all users</p>
            </div>
            <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p class="text-xs text-gray-500 mb-1">Google Sign-In</p>
              <p class="text-2xl font-bold text-white">{{ analytics.authMethods.google }}<span class="text-sm text-gray-500 font-normal ml-1">users</span></p>
              <p class="text-xs text-gray-500 mt-1">vs {{ analytics.authMethods.email }} email</p>
            </div>
          </div>

          <!-- Signups chart -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-white">New Signups</h3>
              <span class="text-xs text-gray-500">Last {{ analyticsDays }} days · total {{ analytics.signupsPerDay.reduce((a, d) => a + d.count, 0) }}</span>
            </div>
            <BarChart :data="analytics.signupsPerDay" color="#8b5cf6" />
          </div>

          <!-- Recordings chart -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-white">Recordings Created</h3>
              <span class="text-xs text-gray-500">Last {{ analyticsDays }} days · total {{ analytics.recordingsPerDay.reduce((a, d) => a + d.count, 0) }}</span>
            </div>
            <BarChart :data="analytics.recordingsPerDay" color="#3b82f6" />
          </div>

          <!-- Status + Top users -->
          <div class="grid md:grid-cols-2 gap-5">
            <!-- Status breakdown -->
            <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 class="font-semibold text-white mb-4">Recording Status Breakdown</h3>
              <div v-if="!analytics.statusBreakdown.length" class="text-gray-500 text-sm">No recordings.</div>
              <div v-else class="space-y-4">
                <div v-for="s in analytics.statusBreakdown" :key="s._id" class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-gray-300 capitalize">{{ s._id }}</span>
                    <span class="text-gray-400">{{ s.count }}</span>
                  </div>
                  <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-2 rounded-full transition-all" :class="statusBarColor(s._id)"
                      :style="{ width: Math.max(3, Math.round((s.count / analyticsMaxStatus) * 100)) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Top users -->
            <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 class="font-semibold text-white mb-4">Top Users by Recordings</h3>
              <div v-if="!analytics.topUsers.length" class="text-gray-500 text-sm">No data.</div>
              <ul v-else class="space-y-3">
                <li v-for="(u, i) in analytics.topUsers.slice(0, 8)" :key="u.email || i" class="flex items-center gap-3">
                  <span class="w-5 shrink-0 text-xs text-gray-600 text-right font-mono">{{ i + 1 }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-white truncate leading-none">{{ u.name || '—' }}</p>
                    <p class="text-xs text-gray-500 truncate mt-0.5">{{ u.email || '' }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-sm font-bold text-white">{{ u.count }}</p>
                    <p class="text-xs text-gray-500">{{ fmtDuration(u.totalDuration) }}</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- Auth method donut -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 class="font-semibold text-white mb-5">Auth Method Distribution</h3>
            <div class="flex items-center gap-10">
              <AuthDonut :google="analytics.authMethods.google" :email="analytics.authMethods.email" />
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-orange-500 shrink-0"></div>
                  <div>
                    <p class="text-sm text-white font-medium">Google — {{ analytics.authMethods.google }}</p>
                    <p class="text-xs text-gray-500">{{ analytics.authMethods.google + analytics.authMethods.email > 0 ? Math.round(analytics.authMethods.google / (analytics.authMethods.google + analytics.authMethods.email) * 100) : 0 }}% of users</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-violet-500 shrink-0"></div>
                  <div>
                    <p class="text-sm text-white font-medium">Email — {{ analytics.authMethods.email }}</p>
                    <p class="text-xs text-gray-500">{{ analytics.authMethods.google + analytics.authMethods.email > 0 ? Math.round(analytics.authMethods.email / (analytics.authMethods.google + analytics.authMethods.email) * 100) : 0 }}% of users</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

    </div>

    <!-- User detail drawer -->
    <transition name="drawer">
      <div v-if="selectedUser" class="fixed inset-0 z-50 flex justify-end" @click.self="selectedUser = null">
        <div class="w-full max-w-md bg-gray-900 border-l border-gray-800 h-full overflow-y-auto shadow-2xl">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
            <h3 class="font-semibold text-white">User Detail</h3>
            <button @click="selectedUser = null" class="text-gray-400 hover:text-white text-xl leading-none">×</button>
          </div>
          <div class="p-5 space-y-5">
            <!-- Avatar + name -->
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-violet-900 text-violet-300 flex items-center justify-center text-xl font-bold">{{ initials(selectedUser.user.name) }}</div>
              <div>
                <p class="font-bold text-white text-lg leading-none">{{ selectedUser.user.name }}</p>
                <p class="text-gray-400 text-sm mt-1">{{ selectedUser.user.email }}</p>
                <div class="flex gap-2 mt-2">
                  <span :class="['text-xs px-2 py-0.5 rounded-full', selectedUser.user.isVerified ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400']">{{ selectedUser.user.isVerified ? 'Verified' : 'Unverified' }}</span>
                  <span :class="['text-xs px-2 py-0.5 rounded-full', selectedUser.user.privacyAccepted ? 'bg-blue-900/50 text-blue-400' : 'bg-red-900/50 text-red-400']">{{ selectedUser.user.privacyAccepted ? 'Privacy ✓' : 'No consent' }}</span>
                  <span v-if="selectedUser.user.googleId" class="text-xs px-2 py-0.5 rounded-full bg-orange-900/50 text-orange-400">Google</span>
                </div>
              </div>
            </div>

            <!-- Detail rows -->
            <div class="grid grid-cols-2 gap-3">
              <DetailRow label="Joined" :value="fmtDate(selectedUser.user.createdAt)" />
              <DetailRow label="Role" :value="selectedUser.user.role" />
              <DetailRow label="Privacy Accepted" :value="selectedUser.user.privacyAcceptedAt ? fmtDate(selectedUser.user.privacyAcceptedAt) : '—'" />
              <DetailRow label="Recordings" :value="String(selectedUser.recordings.length)" />
            </div>

            <!-- Recordings list -->
            <div>
              <h4 class="text-sm font-semibold text-gray-300 mb-3">Recordings (last 20)</h4>
              <div v-if="selectedUser.recordings.length === 0" class="text-sm text-gray-500">No recordings.</div>
              <ul v-else class="space-y-2">
                <li v-for="r in selectedUser.recordings" :key="r._id" class="bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-white truncate">{{ r.title }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ fmtDuration(r.duration) }} · {{ fmtDate(r.createdAt) }}</p>
                  </div>
                  <span :class="['text-xs px-2 py-0.5 rounded-full', statusClass(r.status)]">{{ r.status }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Delete confirm modal -->
    <div v-if="deleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" @click.self="deleteConfirm = null">
      <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 class="font-bold text-white text-lg mb-2">Delete User?</h3>
        <p class="text-gray-400 text-sm mb-5">This will permanently delete <strong class="text-white">{{ deleteConfirm.name }}</strong> and all their recordings. This cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="deleteConfirm = null" class="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition">Cancel</button>
          <button @click="executeDeleteUser" :disabled="deleteLoading" class="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition disabled:opacity-50">
            {{ deleteLoading ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue';
import { adminApi, authState } from '@/api';

const adminEmail = computed(() => authState.user?.email || '');
const globalError = ref('');

// ── Sub-components (inline to keep file count low) ──────────────────────────
const StatCard = defineComponent({
  props: ['label', 'value', 'color', 'icon'],
  setup(props) {
    const colorMap = {
      violet: 'bg-violet-900/50 text-violet-300',
      green:  'bg-green-900/50 text-green-300',
      blue:   'bg-blue-900/50 text-blue-300',
      yellow: 'bg-yellow-900/50 text-yellow-300',
    };
    return () => h('div', { class: 'bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4' }, [
      h('div', { class: `w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[props.color] || colorMap.violet}` },
        h('span', { class: 'text-lg font-bold' }, props.value ?? '—')
      ),
      h('div', {}, [
        h('p', { class: 'text-2xl font-bold text-white leading-none' }, props.value ?? '—'),
        h('p', { class: 'text-xs text-gray-500 mt-1' }, props.label),
      ])
    ]);
  }
});

const DetailRow = defineComponent({
  props: ['label', 'value'],
  setup(props) {
    return () => h('div', { class: 'bg-gray-800 rounded-xl px-4 py-3' }, [
      h('p', { class: 'text-xs text-gray-500 mb-1' }, props.label),
      h('p', { class: 'text-sm text-white font-medium' }, props.value || '—'),
    ]);
  }
});

// Pure-SVG bar chart — no external library
const BarChart = defineComponent({
  props: ['data', 'color'],
  setup(props) {
    return () => {
      const data = props.data || [];
      if (!data.length) return h('div', { class: 'text-gray-500 text-sm py-4' }, 'No data');
      const W = 600, H = 80;
      const max = Math.max(...data.map(d => d.count), 1);
      const gap = 1;
      const barW = Math.floor((W - 20) / data.length) - gap;
      const labelEvery = Math.ceil(data.length / 7);
      const children = [];
      data.forEach((d, i) => {
        const barH = Math.max(2, Math.round((d.count / max) * H));
        const x = 10 + i * (barW + gap);
        const y = H - barH;
        children.push(h('rect', { key: `b${i}`, x, y, width: barW, height: barH, fill: props.color, rx: 2, opacity: 0.85 }));
        if (i % labelEvery === 0) {
          children.push(h('text', { key: `l${i}`, x: x + barW / 2, y: H + 16, 'text-anchor': 'middle', 'font-size': 9, fill: '#6b7280' }, d.date.slice(5)));
        }
        if (d.count > 0) {
          children.push(h('title', { key: `t${i}` }, `${d.date}: ${d.count}`));
        }
      });
      // y-axis max label
      children.push(h('text', { key: 'ymax', x: 4, y: 8, 'font-size': 9, fill: '#6b7280' }, String(max)));
      return h('div', { class: 'overflow-x-auto' },
        h('svg', { viewBox: `0 0 ${W} ${H + 24}`, class: 'w-full', style: 'min-width:300px' }, children)
      );
    };
  }
});

// Donut chart for auth methods
const AuthDonut = defineComponent({
  props: ['google', 'email'],
  setup(props) {
    return () => {
      const total = (props.google || 0) + (props.email || 0);
      if (!total) return h('div', { class: 'text-gray-500 text-sm' }, 'No data');
      const r = 36, cx = 50, cy = 50, circ = 2 * Math.PI * r;
      const googleArc = (props.google / total) * circ;
      return h('svg', { viewBox: '0 0 100 100', class: 'w-24 h-24', style: 'transform: rotate(-90deg)' }, [
        h('circle', { cx, cy, r, fill: 'none', stroke: '#7c3aed', 'stroke-width': 14, 'stroke-dasharray': `${circ} 0` }),
        h('circle', { cx, cy, r, fill: 'none', stroke: '#f97316', 'stroke-width': 14, 'stroke-dasharray': `${googleArc} ${circ - googleArc}` }),
      ]);
    };
  }
});

// ── Tabs ─────────────────────────────────────────────────────────────────────
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'recordings', label: 'Recordings' },
  { id: 'analytics', label: 'Analytics' },
];
const activeTab = ref('overview');

// ── Stats ─────────────────────────────────────────────────────────────────────
const stats = ref(null);
const statsLoading = ref(false);

async function loadStats() {
  statsLoading.value = true;
  try {
    stats.value = await adminApi.getStats();
  } catch (e) {
    globalError.value = e.message || 'Failed to load stats';
  } finally {
    statsLoading.value = false;
  }
}

// ── Activity ─────────────────────────────────────────────────────────────────
const activity = ref([]);
const activityLoading = ref(false);

async function loadActivity() {
  activityLoading.value = true;
  try {
    const data = await adminApi.getActivity(40);
    activity.value = data.events;
  } catch (e) {
    globalError.value = e.message || 'Failed to load activity';
  } finally {
    activityLoading.value = false;
  }
}

// ── Users ─────────────────────────────────────────────────────────────────────
const users = ref([]);
const usersLoading = ref(false);
const userSearch = ref('');
const userPage = ref(1);
const userTotal = ref(0);
const userPages = ref(1);
let userSearchTimer = null;

async function loadUsers() {
  usersLoading.value = true;
  try {
    const data = await adminApi.getUsers(userPage.value, userSearch.value);
    users.value = data.users;
    userTotal.value = data.total;
    userPages.value = data.pages;
  } catch (e) {
    globalError.value = e.message || 'Failed to load users';
  } finally {
    usersLoading.value = false;
  }
}

function debouncedUserSearch() {
  userPage.value = 1;
  clearTimeout(userSearchTimer);
  userSearchTimer = setTimeout(loadUsers, 350);
}

// User detail drawer
const selectedUser = ref(null);
const drawerLoading = ref(false);

async function openUser(u) {
  drawerLoading.value = true;
  selectedUser.value = { user: u, recordings: [] };
  try {
    const data = await adminApi.getUser(u._id);
    selectedUser.value = data;
  } catch {
    // keep shallow data
  } finally {
    drawerLoading.value = false;
  }
}

// Delete user
const deleteConfirm = ref(null);
const deleteLoading = ref(false);

function confirmDeleteUser(u) {
  deleteConfirm.value = u;
}

async function executeDeleteUser() {
  if (!deleteConfirm.value) return;
  deleteLoading.value = true;
  try {
    await adminApi.deleteUser(deleteConfirm.value._id);
    users.value = users.value.filter(u => u._id !== deleteConfirm.value._id);
    userTotal.value--;
    if (selectedUser.value?.user?._id === deleteConfirm.value._id) selectedUser.value = null;
    deleteConfirm.value = null;
  } catch (e) {
    globalError.value = e.message || 'Failed to delete user';
  } finally {
    deleteLoading.value = false;
  }
}

// ── Recordings ───────────────────────────────────────────────────────────────
const recordings = ref([]);
const recsLoading = ref(false);
const recSearch = ref('');
const recPage = ref(1);
const recTotal = ref(0);
const recPages = ref(1);
let recSearchTimer = null;

async function loadRecordings() {
  recsLoading.value = true;
  try {
    const data = await adminApi.getRecordings(recPage.value, recSearch.value);
    recordings.value = data.recordings;
    recTotal.value = data.total;
    recPages.value = data.pages;
  } catch (e) {
    globalError.value = e.message || 'Failed to load recordings';
  } finally {
    recsLoading.value = false;
  }
}

function debouncedRecSearch() {
  recPage.value = 1;
  clearTimeout(recSearchTimer);
  recSearchTimer = setTimeout(loadRecordings, 350);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(sec) {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusClass(s) {
  if (!s) return 'bg-gray-800 text-gray-400';
  if (s === 'completed' || s === 'summarized') return 'bg-green-900/50 text-green-400';
  if (s === 'transcribed') return 'bg-blue-900/50 text-blue-400';
  if (s === 'failed') return 'bg-red-900/50 text-red-400';
  return 'bg-gray-800 text-gray-400';
}

// ── Analytics ────────────────────────────────────────────────────────────────
const analytics = ref(null);
const analyticsLoading = ref(false);
const analyticsDays = ref(30);

const analyticsMaxStatus = computed(() => {
  if (!analytics.value?.statusBreakdown?.length) return 1;
  return Math.max(...analytics.value.statusBreakdown.map(s => s.count), 1);
});

async function loadAnalytics() {
  analyticsLoading.value = true;
  try {
    analytics.value = await adminApi.getAnalytics(analyticsDays.value);
  } catch (e) {
    globalError.value = e.message || 'Failed to load analytics';
  } finally {
    analyticsLoading.value = false;
  }
}

function statusBarColor(s) {
  if (s === 'completed' || s === 'summarized') return 'bg-green-500';
  if (s === 'transcribed') return 'bg-blue-500';
  if (s === 'failed') return 'bg-red-500';
  if (s === 'pending') return 'bg-yellow-500';
  return 'bg-violet-500';
}

function fmtHours(sec) {
  return ((sec || 0) / 3600).toFixed(1);
}

function fmtGB(bytes) {
  if (!bytes) return '0.00';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => {
  loadStats();
  loadActivity();
  loadUsers();
  loadRecordings();
  loadAnalytics();
});
</script>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: opacity 0.25s ease; }
.drawer-enter-active .bg-gray-900, .drawer-leave-active .bg-gray-900 { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
.drawer-enter-from .bg-gray-900, .drawer-leave-to .bg-gray-900 { transform: translateX(100%); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
</style>
