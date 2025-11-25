import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="Home"
          >
            <img 
              src={logo} 
              alt="House Rules" 
              className="h-10 w-auto"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
