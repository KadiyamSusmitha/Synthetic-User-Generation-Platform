import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

function DashboardLayout({ children }) {
  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFA]">

      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Application Area */}
      <div className="flex h-screen min-w-0 flex-col lg:ml-56">

        {/* Fixed TopBar */}
        <TopBar />

        {/* Only Page Content Scrolls */}
        <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-[96px] sm:px-7 sm:pt-[96px] lg:px-8 lg:pb-7 lg:pt-[96px]">
          {children}
        </main>

      </div>
    </div>
  );
}

export default DashboardLayout;