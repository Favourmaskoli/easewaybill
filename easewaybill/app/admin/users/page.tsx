// "use client";

// import { useState } from "react";
// import { Search, Users, UserCheck, UserX, ChevronDown } from "lucide-react";
// import { useAdminUsers } from "@/lib/hooks/useAdmin";
// import type { AdminUser } from "@/lib/api/admin.api";

// const roleColors: Record<string, string> = {
//   SELLER: "bg-green-100 text-green-800",
//   BUYER: "bg-blue-100 text-blue-800",
//   RIDER: "bg-amber-100 text-amber-800",
//   ADMIN: "bg-red-100 text-red-800",
// };

// const roleFilters = ["All", "SELLER", "BUYER", "RIDER", "ADMIN"];

// function UserRow({
//   user,
//   onSuspend,
//   onUnsuspend,
// }: {
//   user: AdminUser;
//   onSuspend: (id: string) => void;
//   onUnsuspend: (id: string) => void;
// }) {
//   const [isActing, setIsActing] = useState(false);

//   const handleToggle = async () => {
//     setIsActing(true);
//     try {
//       if (user.isActive) await onSuspend(user.id);
//       else await onUnsuspend(user.id);
//     } finally {
//       setIsActing(false);
//     }
//   };

//   return (
//     <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
//       <td className="px-5 py-4">
//         <div className="flex items-center gap-3">
//           <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
//             {user.firstName.charAt(0)}
//             {user.lastName.charAt(0)}
//           </div>
//           <div>
//             <p className="text-sm font-semibold text-gray-900">
//               {user.firstName} {user.lastName}
//             </p>
//             <p className="text-xs text-gray-400">{user.email}</p>
//           </div>
//         </div>
//       </td>
//       <td className="px-5 py-4">
//         <span
//           className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleColors[user.role] ?? "bg-gray-100 text-gray-600"}`}
//         >
//           {user.role}
//         </span>
//       </td>
//       <td className="px-5 py-4">
//         <div className="flex items-center gap-1">
//           <span
//             className={`w-2 h-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-400"}`}
//           />
//           <span className="text-xs text-gray-600">
//             {user.isActive ? "Active" : "Suspended"}
//           </span>
//         </div>
//       </td>
//       <td className="px-5 py-4">
//         <span className="text-xs text-gray-500">
//           {user.ordersAsSeller}S / {user.ordersAsBuyer}B
//         </span>
//       </td>
//       <td className="px-5 py-4">
//         <span className="text-xs text-gray-400">
//           {new Date(user.createdAt).toLocaleDateString("en-NG", {
//             day: "numeric",
//             month: "short",
//             year: "numeric",
//           })}
//         </span>
//       </td>
//       <td className="px-5 py-4">
//         {user.role !== "ADMIN" && (
//           <button
//             onClick={handleToggle}
//             disabled={isActing}
//             className={[
//               "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50",
//               user.isActive
//                 ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
//                 : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200",
//             ].join(" ")}
//           >
//             {user.isActive ? (
//               <>
//                 <UserX size={13} /> Suspend
//               </>
//             ) : (
//               <>
//                 <UserCheck size={13} /> Reactivate
//               </>
//             )}
//           </button>
//         )}
//       </td>
//     </tr>
//   );
// }

// export default function AdminUsersPage() {
//   const [roleFilter, setRoleFilter] = useState("All");
//   const [search, setSearch] = useState("");
//   const [searchInput, setSearchInput] = useState("");

//   const { users, total, isLoading, suspendUser, unsuspendUser } = useAdminUsers(
//     {
//       role: roleFilter === "All" ? undefined : roleFilter,
//       search: search || undefined,
//       limit: 50,
//     },
//   );

//   return (
//     <div className="p-6 space-y-5">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Users</h1>
//           <p className="text-sm text-gray-500 mt-1">
//             {total} total registered users
//           </p>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="flex items-center gap-3 flex-wrap">
//         <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl w-64">
//           <Search size={15} className="text-gray-400 shrink-0" />
//           <input
//             type="search"
//             placeholder="Search by name or email..."
//             value={searchInput}
//             onChange={(e) => setSearchInput(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter") setSearch(searchInput);
//             }}
//             className="bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 w-full"
//           />
//         </div>

//         <div className="flex gap-2">
//           {roleFilters.map((r) => (
//             <button
//               key={r}
//               onClick={() => setRoleFilter(r)}
//               className={[
//                 "px-4 py-2 rounded-full text-xs font-semibold transition-all",
//                 roleFilter === r
//                   ? "bg-red-500 text-white"
//                   : "bg-white text-gray-600 border border-gray-200 hover:border-red-300",
//               ].join(" ")}
//             >
//               {r}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
//         {isLoading ? (
//           <div className="py-16 text-center">
//             <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
//             <p className="text-gray-400 text-sm">Loading users...</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gray-50 border-b border-gray-100">
//                   {["User", "Role", "Status", "Orders", "Joined", "Action"].map(
//                     (col) => (
//                       <th
//                         key={col}
//                         className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3.5"
//                       >
//                         {col}
//                       </th>
//                     ),
//                   )}
//                 </tr>
//               </thead>
//               <tbody>
//                 {users.map((user) => (
//                   <UserRow
//                     key={user.id}
//                     user={user}
//                     onSuspend={suspendUser}
//                     onUnsuspend={unsuspendUser}
//                   />
//                 ))}
//               </tbody>
//             </table>

//             {users.length === 0 && (
//               <div className="py-16 text-center">
//                 <Users size={40} className="text-gray-300 mx-auto mb-3" />
//                 <p className="text-gray-400 text-sm">No users found</p>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { Search, Users, UserCheck, UserX, ChevronDown } from "lucide-react";
import { useAdminUsers } from "@/lib/hooks/useAdmin";
import { adminApi } from "@/lib/api/admin.api";
import type { AdminUser } from "@/lib/api/admin.api";

// ── Role badge colours — matches USER/RIDER/ADMIN enum ─────────────
const roleMeta: Record<string, { bg: string; color: string; label: string }> = {
  USER: { bg: "#dbeafe", color: "#1e40af", label: "User" },
  RIDER: { bg: "#fef3c7", color: "#92400e", label: "Rider" },
  ADMIN: { bg: "#fee2e2", color: "#991b1b", label: "Admin" },
};

const roleFilters = ["All", "USER", "RIDER", "ADMIN"];

// ── Role Dropdown ────────────────────────────────────────────────
function RoleDropdown({
  user,
  onRoleChange,
}: {
  user: AdminUser;
  onRoleChange: (
    userId: string,
    role: "USER" | "RIDER" | "ADMIN",
  ) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [acting, setActing] = useState(false);
  const meta = roleMeta[user.role] ?? roleMeta.USER;
  const roles: Array<"USER" | "RIDER" | "ADMIN"> = ["USER", "RIDER", "ADMIN"];

  const handleSelect = async (role: "USER" | "RIDER" | "ADMIN") => {
    if (role === user.role) {
      setOpen(false);
      return;
    }
    setActing(true);
    setOpen(false);
    try {
      await onRoleChange(user.id, role);
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        disabled={acting}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all disabled:opacity-50"
        style={{
          background: meta.bg,
          color: meta.color,
          border: `1px solid ${meta.color}30`,
        }}
      >
        {acting ? "Updating..." : meta.label}
        {!acting && <ChevronDown size={11} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-[calc(100%+6px)] left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[130px]">
            {roles.map((r) => {
              const m = roleMeta[r];
              const isCurrent = r === user.role;
              return (
                <button
                  key={r}
                  onClick={() => handleSelect(r)}
                  className={[
                    "w-full text-left px-3.5 py-2 flex items-center gap-2 text-xs font-semibold transition-colors",
                    isCurrent ? "bg-gray-50" : "bg-white hover:bg-gray-50",
                  ].join(" ")}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: m.color }}
                  />
                  {m.label}
                  {isCurrent && (
                    <span className="ml-auto text-[10px] text-gray-400">
                      current
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── User Row ──────────────────────────────────────────────────────
function UserRow({
  user,
  onSuspend,
  onUnsuspend,
  onRoleChange,
}: {
  user: AdminUser;
  onSuspend: (id: string) => void;
  onUnsuspend: (id: string) => void;
  onRoleChange: (
    userId: string,
    role: "USER" | "RIDER" | "ADMIN",
  ) => Promise<void>;
}) {
  const [isActing, setIsActing] = useState(false);

  const handleToggle = async () => {
    setIsActing(true);
    try {
      if (user.isActive) await onSuspend(user.id);
      else await onUnsuspend(user.id);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role — now a dropdown instead of a static badge */}
      <td className="px-5 py-4">
        <RoleDropdown user={user} onRoleChange={onRoleChange} />
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-1">
          <span
            className={`w-2 h-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-400"}`}
          />
          <span className="text-xs text-gray-600">
            {user.isActive ? "Active" : "Suspended"}
          </span>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="text-xs text-gray-500">
          {user.ordersAsSeller}S / {user.ordersAsBuyer}B
        </span>
      </td>
      <td className="px-5 py-4">
        <span className="text-xs text-gray-400">
          {new Date(user.createdAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </td>
      <td className="px-5 py-4">
        {user.role !== "ADMIN" && (
          <button
            onClick={handleToggle}
            disabled={isActing}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50",
              user.isActive
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200",
            ].join(" ")}
          >
            {user.isActive ? (
              <>
                <UserX size={13} /> Suspend
              </>
            ) : (
              <>
                <UserCheck size={13} /> Reactivate
              </>
            )}
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { users, total, isLoading, suspendUser, unsuspendUser, refetch } =
    useAdminUsers({
      role: roleFilter === "All" ? undefined : roleFilter,
      search: search || undefined,
      limit: 50,
    });

  const handleRoleChange = async (
    userId: string,
    role: "USER" | "RIDER" | "ADMIN",
  ) => {
    await adminApi.changeUserRole(userId, role);
    refetch();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} total registered users
          </p>
        </div>
      </div>

      {/* Role system info banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
        <UserCheck size={15} className="text-green-600 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 leading-relaxed">
          Click the role badge on any row to promote a <strong>User</strong> to{" "}
          <strong>Rider</strong> or <strong>Admin</strong>, or demote them back.
          You cannot change your own role or remove the last admin.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl w-64">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="search"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchInput);
            }}
            className="bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 w-full"
          />
        </div>

        <div className="flex gap-2">
          {roleFilters.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={[
                "px-4 py-2 rounded-full text-xs font-semibold transition-all",
                roleFilter === r
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-red-300",
              ].join(" ")}
            >
              {r === "All" ? "All" : (roleMeta[r]?.label ?? r)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["User", "Role", "Status", "Orders", "Joined", "Action"].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3.5"
                      >
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onSuspend={suspendUser}
                    onUnsuspend={unsuspendUser}
                    onRoleChange={handleRoleChange}
                  />
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="py-16 text-center">
                <Users size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No users found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
