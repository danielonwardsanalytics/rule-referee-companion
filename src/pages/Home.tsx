import AIAdjudicator from "@/components/AIAdjudicator";
import MyGames from "@/components/MyGames";
import { MyTournaments } from "@/components/MyTournaments";
import { MyHouseRules } from "@/components/MyHouseRules";
import logo from "@/assets/logo.png";
import { Loader2, Crown } from "lucide-react";
import { TrialBanner } from "@/components/premium/TrialBanner";
import { usePremium } from "@/hooks/usePremium";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";


const Home = () => {
  const { hasPremiumAccess, isFree, isTrial } = usePremium();
  const { startCheckout, isCheckoutLoading } = useSubscription();

  return (
    <>
      <div className="min-h-screen relative pb-20">
        <TrialBanner />
        <div className="fixed inset-0 -z-10 bg-background" />

        {/* New Hero Section - Sunrise Arc */}
        <section className="relative h-[28vh] min-h-[220px] overflow-hidden bg-background" aria-label="New hero section">
          {/* Orange Arc - Top Section */}
          <svg 
            className="absolute inset-x-0 top-0 w-full h-[65%]" 
            viewBox="0 0 1200 200" 
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M 0,0 L 1200,0 L 1200,200 Q 600,80 0,200 Z" 
              fill="#F5A623"
            />
          </svg>

          {/* Logo Container Centered in Orange Section */}
          <div className="absolute top-[15px] left-1/2 -translate-x-1/2 z-10">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#2C3E50] border-4 border-[#D97706] shadow-xl flex items-center justify-center overflow-hidden">
              <img 
                src={logo} 
                alt="House Rules" 
                className="w-full h-full object-contain scale-125"
              />
            </div>
          </div>

          {/* Title in White Space Below Arc */}
          <div className="absolute bottom-[20px] left-0 right-0 text-center z-10 px-4">
            <h1 className="text-xl sm:text-2xl font-normal text-foreground tracking-normal">
              Play sunrise to sunset...
            </h1>
            <p className="text-sm sm:text-base font-normal text-muted-foreground mt-1">
              Your game. No debates.
            </p>
          </div>
        </section>

        {/* Unlock Premium Button - Only shown for non-premium users (free + trial) */}
        {!hasPremiumAccess || isTrial ? (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
            <div className="flex justify-center">
              <Button
                size="default"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold px-6 shadow-lg hover:shadow-xl transition-all"
                onClick={() => startCheckout()}
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Crown className="h-4 w-4 mr-2" />
                )}
                {isTrial ? "Continue After Trial" : "Unlock Unlimited House Rules"}
              </Button>
            </div>
          </section>
        ) : null}

        {/* AI Adjudicator Section */}
        <AIAdjudicator />

        {/* My Games Section */}
        <MyGames />

        {/* My Tournaments Section */}
        <MyTournaments />

        {/* My House Rules Section */}
        <MyHouseRules />

        {/* Main Content */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="bg-card rounded-2xl p-8 border border-border shadow-[var(--shadow-card)] backdrop-blur-sm animate-slide-up hover-lift" style={{ animationDelay: '0.5s' }} aria-label="Features">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Never argue about rules again 🤝
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Get instant answers to any rule question. Our AI-powered assistant knows the official rules for hundreds of games and can settle any dispute in seconds.
              </p>
            </div>
          </section>
        </main>
      </div>
      
    </>
  );
};

export default Home;
