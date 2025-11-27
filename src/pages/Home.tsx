import GameCard from "@/components/GameCard";
import ChatInterface from "@/components/ChatInterface";
import MyGames from "@/components/MyGames";
import heroImage from "@/assets/hero-image.jpg";
import logo from "@/assets/logo.png";
import { useAllGames } from "@/hooks/useAllGames";
import { Loader2 } from "lucide-react";
import { TrialBanner } from "@/components/premium/TrialBanner";

const Home = () => {
  const { games, isLoading } = useAllGames();
  // Show 8 games now that all have images - prioritize most popular/recognizable
  const popularGameSlugs = ['uno', 'monopoly-deal', 'phase10', 'skipbo', 'poker', 'hearts', 'rummy', 'go-fish'];
  const popularGames = games
    .filter(g => g.image_url)
    .sort((a, b) => {
      const aIndex = popularGameSlugs.indexOf(a.slug);
      const bIndex = popularGameSlugs.indexOf(b.slug);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    })
    .slice(0, 8);

  return (
    <div className="min-h-screen relative pb-20">
      <TrialBanner />
      <div className="fixed inset-0 -z-10 bg-background" style={{ backgroundImage: 'var(--gradient-background)' }} />

      {/* New Hero Section - Sunrise Arc */}
      <section className="relative h-[35vh] min-h-[300px] overflow-hidden bg-white" aria-label="New hero section">
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
        <div className="absolute top-[30px] left-1/2 -translate-x-1/2 z-10">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#2C3E50] border-4 border-white shadow-xl flex items-center justify-center p-3">
            <img 
              src={logo} 
              alt="House Rules" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Title in White Space Below Arc */}
        <div className="absolute bottom-[60px] left-0 right-0 text-center z-10 px-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-normal">
            Play sunrise to sunset
          </h1>
        </div>
      </section>

      {/* Original Hero Section */}
      <section className="relative h-[35vh] min-h-[300px] overflow-hidden animate-slide-down" aria-label="Hero section">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-green-300 to-teal-400">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.2),transparent_50%)]" />
        </div>
        
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
          <div className="animate-scale-in mb-6">
            <img 
              src={logo} 
              alt="House Rules" 
              className="h-32 sm:h-40 lg:h-48 w-auto drop-shadow-2xl"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 animate-slide-up drop-shadow-lg">
            <span className="block">Your rules.</span>
            <span className="block">Your game.</span>
            <span className="block">No debates.</span>
          </h1>
        </div>
      </section>

      {/* Quick Fire Question Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up" style={{ animationDelay: '0.2s' }} aria-label="Quick questions">
        <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-card)] overflow-hidden backdrop-blur-sm hover-lift">
          <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5">
            <h2 className="text-2xl font-bold text-white">Quick Fire Question</h2>
            <p className="text-white/90 text-sm mt-1">Get instant answers about any game rule</p>
          </div>
          <div className="p-6">
            <ChatInterface />
          </div>
        </div>
      </section>

      {/* My Games Section */}
      <MyGames />

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-12 animate-slide-up" style={{ animationDelay: '0.3s' }} aria-label="Popular games">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Popular Games
              </h2>
              <p className="text-muted-foreground">
                Quick access to your favorite card games
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {popularGames.map((game, index) => (
                <div key={game.id} style={{ animationDelay: `${index * 0.05}s` }}>
                  <GameCard 
                    id={game.slug}
                    title={game.name}
                    image={game.image_url || ""}
                    players="Various"
                    difficulty="Various"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-card rounded-2xl p-8 border border-border shadow-[var(--shadow-card)] backdrop-blur-sm animate-slide-up hover-lift" style={{ animationDelay: '0.4s' }} aria-label="Features">
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
  );
};

export default Home;
