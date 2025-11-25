import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="relative z-40 w-full bg-gradient-to-b from-primary via-primary/90 to-primary/70 pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/")}
            className="group transition-transform duration-300 hover:scale-105"
            aria-label="Home"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
              <img 
                src={logo} 
                alt="House Rules" 
                className="relative h-24 sm:h-32 w-auto drop-shadow-2xl"
              />
            </div>
          </button>
        </div>
      </div>
      {/* Seamless transition curve */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-primary/70 to-background" />
    </header>
  );
};

export default Header;
