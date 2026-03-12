import React from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from '../components/Sidebar';

const PAGE_META = [
  { match: (pathname: string) => pathname === '/admin', title: '概览', description: '后台总览' },
  { match: (pathname: string) => pathname.startsWith('/admin/plants'), title: '植物库管理', description: '植物资料维护与发布' },
  { match: (pathname: string) => pathname.startsWith('/admin/adoptions'), title: '已认领植物', description: '认领关系与状态查看' },
  { match: (pathname: string) => pathname.startsWith('/admin/monitoring'), title: '实时监控', description: '监控页面' },
  { match: (pathname: string) => pathname.startsWith('/admin/timeline'), title: '成长时间轴', description: '成长记录查看' },
  { match: (pathname: string) => pathname.startsWith('/admin/diary'), title: '成长日记', description: '日记内容查看' },
  { match: (pathname: string) => pathname.startsWith('/admin/logs'), title: '操作日志', description: '系统操作记录' },
  { match: (pathname: string) => pathname.startsWith('/admin/stream-test'), title: '视频流测试', description: '视频能力调试' },
  { match: (pathname: string) => pathname.startsWith('/admin/network-diagnostic'), title: '网络诊断', description: '网络与设备诊断' },
  { match: (pathname: string) => pathname.startsWith('/admin/video-status'), title: '视频状态', description: '视频服务状态查看' }
];

export const DashboardLayout = () => {
  const location = useLocation();
  const currentPage = PAGE_META.find((item) => item.match(location.pathname)) ?? {
    title: 'HeartPlant Admin',
    description: '后台管理'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <header className="px-8 py-6 border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-40">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">{currentPage.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{currentPage.description}</p>
        </header>

        <section className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </section>
      </main>
    </div>
  );
};
