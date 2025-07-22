import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import Dashboard from './pages/Dashboard';
import LeaveRequest from './pages/LeaveRequest';
import History from './pages/History';
import Print from './pages/Print';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import AddStaff from "./pages/AddStaff";
import SignUp from "./pages/SignUp";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/leave-request" element={<LeaveRequest />} />
            <Route path="/history" element={<History />} />
            <Route path="/print" element={<Print />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/add-staff" element={<AddStaff />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
