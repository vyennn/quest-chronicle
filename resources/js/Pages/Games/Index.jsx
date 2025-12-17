import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { Search, Gamepad2, Heart, BookOpen, Sparkles, X, Plus, Edit2, Trash2, User, LogOut, ChevronDown, Menu, Filter, Star, TrendingUp, Clock } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import AuthModal from '@/Components/AuthModal';
import '@google/model-viewer';

export default function Index({ games, userFavorites, userNotes, auth }) {
    // Add this check
    if (!games || games.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <Gamepad2 className="w-20 h-20 text-pink-500 mx-auto mb-4 animate-spin" />
                    <p className="text-xl text-gray-400">Loading games...</p>
                </div>
            </div>
        );
    }
    
    const [selectedGame, setSelectedGame] = useState(null);
    const [favorites, setFavorites] = useState(userFavorites || []);
    const [notes, setNotes] = useState(userNotes || {});
    const [showFavorites, setShowFavorites] = useState(false);
    const [filterGenre, setFilterGenre] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingNote, setEditingNote] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');

    const { scrollYProgress } = useScroll();
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
    const heroOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);
    const heroScale = useTransform(smoothProgress, [0, 0.3], [1, 0.95]);
    const heroY = useTransform(smoothProgress, [0, 0.3], [0, -100]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Add this new useEffect
    useEffect(() => {
        setFavorites(userFavorites || []);
        setNotes(userNotes || {});
    }, [userFavorites, userNotes]);

    const genres = ['all', ...new Set(games.map(g => g.genre))];

    const filteredGames = games.filter(game => {
        const matchesGenre = filterGenre === 'all' || game.genre === filterGenre;
        const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            game.short_description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesGenre && matchesSearch;
    });

    const displayGames = showFavorites
        ? games.filter(g => favorites.includes(g.id))
        : filteredGames;

    const toggleFavorite = async (game) => {
        console.log('Toggle favorite clicked', { game, authUser: auth.user });
        
        if (!auth.user) {
            console.log('User not authenticated, showing login modal');
            setAuthMode('login');
            setShowAuthModal(true);
            return;
        }
    
        const isFavorite = favorites.includes(game.id);
        console.log('Is favorite?', isFavorite);
    
        if (isFavorite) {
            try {
                console.log('Removing favorite:', game.id);
                const response = await fetch(`/favorites/${game.id}`, {
                    method: 'DELETE',
                    headers: { 
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content 
                    }
                });
                console.log('Delete response:', response);
                
                if (response.ok) {
                    setFavorites(prev => prev.filter(id => id !== game.id));
                }
            } catch (error) {
                console.error('Error removing favorite:', error);
            }
        } else {
            try {
                console.log('Adding favorite:', game);
                const response = await fetch('/favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    },
                    body: JSON.stringify({
                        game_id: game.id,
                        game_title: game.title,
                        game_thumbnail: game.thumbnail,
                        game_genre: game.genre
                    })
                });
                console.log('Add response:', response);
                
                if (response.ok) {
                    setFavorites(prev => [...prev, game.id]);
                }
            } catch (error) {
                console.error('Error adding favorite:', error);
            }
        }
    };

    const saveNote = (gameId) => {
        if (!auth.user) {
            setAuthMode('login');
            setShowAuthModal(true);
            return;
        }
    
        router.post('/notes', 
            { game_id: gameId, note: noteText },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNotes(prev => ({ ...prev, [gameId]: noteText }));
                    setEditingNote(null);
                    setNoteText('');
                },
                onError: (errors) => {
                    console.error('Error saving note:', errors);
                }
            }
        );
    };

    const deleteNote = (gameId) => {
        router.delete(`/notes/${gameId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setNotes(prev => {
                    const updated = { ...prev };
                    delete updated[gameId];
                    return updated;
                });
            },
            onError: (errors) => {
                console.error('Error deleting note:', errors);
            }
        });
    };

    const startEditNote = (gameId) => {
        setEditingNote(gameId);
        setNoteText(notes[gameId] || '');
    };

    const handleLogout = () => {
        router.post('/logout', {}, {
            onSuccess: () => {
                setFavorites([]);
                setNotes({});
                setShowFavorites(false);
            }
        });
    };

    const scrollToGames = () => {
        document.getElementById('games-section').scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <>
            <Head title="GameVoyage" />

            <div ref={containerRef} className="min-h-screen bg-white text-white overflow-x-hidden">
                {/* Cursor Follower */}
                <motion.div
                    className="fixed w-6 h-6 border-2 border-violet-500 rounded-full pointer-events-none z-50 mix-blend-difference hidden lg:block"
                    animate={{
                        x: mousePosition.x - 12,
                        y: mousePosition.y - 12,
                    }}
                    transition={{ 
                        type: "tween",
                        duration: 0.1,
                        ease: "linear"
                    }}
                />

                {/* Animated Background Gradient */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        className="absolute w-[800px] h-[800px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(0, 0, 0, 0.15) 0%, transparent 70%)',
                            left: mousePosition.x - 400,
                            top: mousePosition.y - 400,
                        }}
                        transition={{ type: "spring", damping: 50 }}
                    />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                {/* Fixed Navigation Header - FLOATING TRANSPARENT VERSION */}
                <motion.header
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    className="fixed top-0 left-0 right-0 z-40"
                >
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="flex items-center justify-between h-20">
                            {/* Logo - Floating Pill */}
                            <motion.div 
                                className="flex items-center gap-3 cursor-pointer bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
                                whileHover={{ scale: 1.05 }}
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                >
                                    <Gamepad2 className="w-8 h-8 text-violet-500" />
                                </motion.div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-green-400 to-green-400 bg-clip-text text-transparent">
                                    GameVoyage
                                </h1>
                            </motion.div>

                            {/* Desktop Menu - Floating Pill */}
                            <nav className="hidden lg:flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2 bg-white/30 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                                <button
                                    onClick={() => {
                                        setShowFavorites(false);
                                        document.getElementById('games-section').scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="px-4 py-2 text-l text-violet-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                >
                                    Explore
                                </button>
                                <button
                                    onClick={() => setShowFavorites(!showFavorites)}
                                    className={`px-4 py-2 text-l transition-all flex items-center gap-2 rounded-full ${
                                        showFavorites 
                                            ? 'text-pink-400 bg-pink-500/20' 
                                            : 'text-violet-500 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <Heart className={`w-4 h-4 ${showFavorites ? 'fill-pink-400 text-pink-400' : ''}`} />
                                    Collection ({favorites.length})
                                </button>
                            </nav>

                            {/* Auth Buttons - Floating Pill */}
                            <div className="flex items-center gap-4">
                                {auth?.user ? (
                                    <div className="relative">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            className="flex items-center gap-2 px-4 py-2 bg-black/30 backdrop-blur-md hover:bg-black/50 rounded-full transition-all border border-white/10"
                                        >
                                            <User className="w-4 h-4" />
                                            <span className="hidden md:inline text-sm">{auth.user.name}</span>
                                        </motion.button>

                                        <AnimatePresence>
                                            {showUserMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                                                >
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-white/5 transition-all text-left text-sm"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Logout
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 bg-white/30 backdrop-blur-md px-2 py-2 rounded-full border border-white/10">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setAuthMode('login');
                                                setShowAuthModal(true);
                                            }}
                                            className="px-4 py-2 text-l text-violet-500 hover:bg-white/10 rounded-full transition-all"
                                        >
                                            Login
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setAuthMode('register');
                                                setShowAuthModal(true);
                                            }}
                                            className="px-4 py-2 text-sm bg-gradient-to-r from-violet-500 to-violet-500 hover:from-green-300 hover:to-green-400 rounded-full transition-all"
                                        >
                                            Sign Up
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* Hero Section - Full Screen */}
                <motion.section className="relative min-h-screen flex items-center justify-center px-4 pt-50">
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 max-w-6xl mx-auto w-full">
                        
                        {/* Left: Text Content */}
                        <div className="text-center lg:text-left max-w-xl space-y-11">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 mb-1 px-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
                            >
                                <Sparkles className="w-5 h-5 text-violet-400" />
                                <span className="text-violet-400 text-sm font-medium tracking-widest uppercase">
                                    Your Free Gaming Universe Awaits
                                </span>
                            </motion.div>

                            <motion.h1
                                className="text-5xl md:text-7xl lg:text-7xl font-bold leading-none"
                            >
                                <motion.span 
                                    initial={{ x: -100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ 
                                        type: "spring", 
                                        damping: 20, 
                                        stiffness: 100,
                                        delay: 0.3 
                                    }}
                                    className="block bg-gradient-to-r from-gray-400 via-gray-400 to-gray-400 bg-clip-text text-transparent"
                                >
                                    Embark on 
                                </motion.span>
                                <motion.span 
                                    initial={{ x: 100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ 
                                        type: "spring", 
                                        damping: 20, 
                                        stiffness: 100, 
                                        delay: 0.5 
                                    }}
                                    className="text-sblock bg-gradient-to-r from-violet-400 via-green-400 to-green-400 bg-clip-text text-transparent"
                                >
                                    GameVoyage
                                </motion.span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.7 }}
                                className="text-lg md:text-xl lg:text-2xl text-gray-400 font-light"
                            >
                                Discover, explore, and chart your adventure across thousands of free-to-play games.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9 }}
                                className="flex flex-col sm:flex-row items-center lg:items-start lg:justify-start justify-center gap-4"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setShowFavorites(false);
                                        scrollToGames();
                                    }}
                                    className="px-8 py-4 bg-gradient-to-r from-violet-500 to-violet-500 rounded-full font-medium text-lg hover:shadow-2xl hover:shadow-violet-500/50 transition-all"
                                >
                                    Start Your Voyage
                                </motion.button>
                                {auth.user && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setShowFavorites(true);
                                            scrollToGames();
                                        }}
                                        className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-full font-medium text-lg border border-white/10 transition-all flex items-center gap-2"
                                    >
                                        <Heart className="w-5 h-5" />
                                        My Collection
                                    </motion.button>
                                )}
                            </motion.div>
                        </div>

                        {/* Right: 3D Model */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ 
                                opacity: 1, 
                                scale: 1,
                                y: [0, -20, 0] 
                            }}
                            transition={{ 
                                opacity: { duration: 1, delay: 0.5 },
                                scale: { duration: 1, delay: 0.5 },
                                y: { 
                                    duration: 4, 
                                    repeat: Infinity, 
                                    ease: "easeInOut",
                                    delay: 1.5 
                                }
                            }}
                            className="w-full max-w-md lg:w-[900px] h-[400px] lg:h-[500px]"
                        >
                            <model-viewer
                                src="Model/arcade-machine.glb"
                                alt="3D Arcade Machine"
                                auto-rotate
                                disable-zoom
                                camera-controls={false}
                                interaction-prompt="none"
                                exposure="1"
                                shadow-intensity="1"
                                environment-image="neutral"
                                loading="eager"
                                reveal="auto"
                                style={{ 
                                    width: '100%', 
                                    height: '100%',
                                    '--poster-color': 'transparent'
                                }}
                            />
                        </motion.div>

                    </div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, y: [0, 10, 0] }}
                        transition={{ 
                            opacity: { delay: 1.2, duration: 0.5 }, 
                            y: { duration: 2, repeat: Infinity, delay: 1.5 } 
                        }}
                        className="absolute bottom-14 left-1/2 transform -translate-x-[10px] cursor-pointer" 
                        onClick={scrollToGames}
                    >
                        <ChevronDown className="w-8 h-8 text-gray-500" />
                    </motion.div>
                </motion.section>
                        {/* 3D Model Section */}
                        <motion.section
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    className="relative flex flex-col lg:flex-row items-center justify-center my-0 gap-11"
>
    {/* First Model */}
    <div className="w-full max-w-sm h-[400px] lg:h-[500px]">
    <model-viewer
    src="/Model/character-employee.glb"
    alt="Character Employee"
    auto-rotate            // spins automatically
    disable-zoom           // disables zoom
    interaction-prompt="none" // removes click/tap hint
    camera-controls={false}    // disables manual rotation
    style={{ width: '100%', height: '100%', '--poster-color': 'transparent' }}
/>

    </div>

    {/* Second Model */}
    <div className="w-full max-w-sm h-[400px] lg:h-[500px]">
    <model-viewer
    src="/Model/character-gamer.glb"
    alt="Character Gamer"
    auto-rotate
    disable-zoom
    interaction-prompt="none"
    camera-controls={false}
    style={{ width: '100%', height: '100%', '--poster-color': 'transparent' }}
/>

    </div>
</motion.section>



                {/* Games Section */}
                <section id="games-section" key={showFavorites ? 'favorites' : 'all'} className="relative py-3 px-4">
                    <div className="container mx-auto max-w-7xl w-full">
                        {/* Section Header */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: false, amount: 0.5 }}
                            transition={{ 
                                type: "spring",
                                damping: 15,
                                stiffness: 150, 
                                duration: 0.6 
                            }}
                            className="text-center mb-8"
                        >
                            <h2 className="text-5xl md:text-7xl font-bold mb-3 bg-gradient-to-r from-violet-500 to-green-500 bg-clip-text text-transparent">
                                Explore Games
                            </h2>
                            
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: false, amount: 0.5 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="text-xl text-gray-400 max-w-2xl mx-auto"
                            >
                                Dive into a curated collection of free-to-play experiences
                            </motion.p>
                        </motion.div>

                        {/* Search & Filters */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-0 space-y-6"
                        >
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search your next adventure..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-14 pr-6 py-5 bg-white/5 backdrop-blur-xl border border-gray/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-lg"
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowFavorites(!showFavorites)}
                                    className={`px-8 py-5 rounded-2xl font-medium transition-all flex items-center justify-center gap-3 text-lg ${
                                        showFavorites
                                            ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                                            : 'bg-white/5 hover:bg-white/10 border border-gray/500/40'
                                    }`}
                                >
                                    <Heart className={`w-6 h-6 ${showFavorites ? 'fill-current' : ''}`} />
                                    <span className="hidden sm:inline">Collection</span>
                                    <span className="bg-wgray/20 px-2 py-1 rounded-full text-sm">{favorites.length}</span>
                                </motion.button>
                            </div>

                            {/* Genre Pills */}
                            <div className="flex gap-3 overflow-x-auto pb-7 scrollbar-hide">
                                {genres.map((genre, index) => (
                                    <motion.button
                                        key={genre}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setFilterGenre(genre)}
                                        className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                            filterGenre === genre
                                                ? 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg shadow-pink-500/30'
                                                : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                        }`}
                                    >
                                        {genre === 'all' ? 'All Genres' : genre}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Games Grid */}
                        <div className="min-h-[600px]">
                            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <AnimatePresence mode="popLayout">
                                    {displayGames.map((game, index) => (
                                        <motion.div
                                            key={game.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ y: -10 }}
                                            className="group relative bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-pink-500/20"
                                        >
                                            {/* Game Image */}
                                            <div className="relative h-56 overflow-hidden">
                                                <motion.img
                                                    whileHover={{ scale: 1.1 }}
                                                    transition={{ duration: 0.6 }}
                                                    src={game.thumbnail}
                                                    alt={game.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                                
                                                {/* Favorite Button */}
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFavorite(game);
                                                    }}
                                                    className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all border border-white/20"
                                                >
                                                    <Heart className={`w-5 h-5 ${favorites.includes(game.id) ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                                                </motion.button>

                                                {/* Genre Badge */}
                                                <span className="absolute top-4 left-4 px-4 py-2 bg-purple-500/80 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider">
                                                    {game.genre}
                                                </span>
                                            </div>

                                            {/* Game Info */}
                                            <div className="p-6 space-y-4">
                                                <h3 className="text-2xl font-bold line-clamp-1 group-hover:text-pink-400 transition-colors">
                                                    {game.title}
                                                </h3>
                                                <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                                                    {game.short_description}
                                                </p>

                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span className="flex items-center gap-2">
                                                        <Gamepad2 className="w-4 h-4" />
                                                        {game.platform}
                                                    </span>
                                                    <span className="line-clamp-1">{game.publisher}</span>
                        </div>

                        {/* Notes Section */}
                        {favorites.includes(game.id) && auth.user && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="pt-4 border-t border-white/10"
                            >
                                {editingNote === game.id ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            placeholder="Add your personal note..."
                                            className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                                            rows="3"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => saveNote(game.id)}
                                                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-sm font-medium"
                                            >
                                                Save
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setEditingNote(null)}
                                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                                            >
                                                Cancel
                                            </motion.button>
                                        </div>
                                    </div>
                                ) : notes[game.id] ? (
                                    <div className="bg-white/5 rounded-xl p-4 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <BookOpen className="w-5 h-5 text-pink-400" />
                                            <div className="flex gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => startEditNote(game.id)}
                                                    className="text-gray-400 hover:text-pink-400 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => deleteNote(game.id)}
                                                    className="text-gray-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed">{notes[game.id]}</p>
                                    </div>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => startEditNote(game.id)}
                                        className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Personal Note
                                    </motion.button>
                                )}
                            </motion.div>
                        )}

                        {/* Explore Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedGame(game)}
                            className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl font-medium transition-all shadow-lg shadow-pink-500/30"
                        >
                            Explore Details
                        </motion.button>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
    </motion.div>
</div>
{/* Empty State */}
{displayGames.length === 0 && (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center -mt-30 pb-64 flex flex-col items-center justify-center"
    >
        <Gamepad2 className="w-20 h-20 text-gray-700 mx-auto mb-6" />
        <p className="text-2xl text-gray-400">No games found</p>
        <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
    </motion.div>
)}
                    </div>
                </section>

                {/* Game Detail Modal */}
                <AnimatePresence>
                    {selectedGame && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
                            onClick={() => setSelectedGame(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 50 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 50 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl"
                            >
                                {/* Modal Header Image */}
                                <div className="relative h-80 md:h-96 overflow-hidden">
                                    <img
                                        src={selectedGame.thumbnail}
                                        alt={selectedGame.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                                    
                                    {/* Close Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setSelectedGame(null)}
                                        className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all border border-white/20"
                                    >
                                        <X className="w-6 h-6" />
                                    </motion.button>

                                    {/* Title Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-8">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-end justify-between"
                                        >
                                            <div>
                                                <h2 className="text-4xl md:text-5xl font-bold mb-3">{selectedGame.title}</h2>
                                                <div className="flex gap-3">
                                                    <span className="px-4 py-2 bg-purple-500/80 backdrop-blur-sm rounded-full text-sm font-bold">
                                                        {selectedGame.genre}
                                                    </span>
                                                    <span className="px-4 py-2 bg-pink-500/80 backdrop-blur-sm rounded-full text-sm font-bold">
                                                        {selectedGame.platform}
                                                    </span>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavorite(selectedGame);
                                                }}
                                                className="p-4 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all border border-white/20"
                                            >
                                                <Heart className={`w-7 h-7 ${favorites.includes(selectedGame.id) ? 'fill-pink-500 text-pink-500' : ''}`} />
                                            </motion.button>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Modal Content */}
                                <div className="p-8 space-y-8">
                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-xl text-gray-300 leading-relaxed"
                                    >
                                        {selectedGame.short_description}
                                    </motion.p>

                                    {/* Game Details Grid */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                            <p className="text-gray-500 text-sm mb-2 uppercase tracking-wider">Publisher</p>
                                            <p className="text-xl font-semibold">{selectedGame.publisher}</p>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                            <p className="text-gray-500 text-sm mb-2 uppercase tracking-wider">Developer</p>
                                            <p className="text-xl font-semibold">{selectedGame.developer}</p>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                            <p className="text-gray-500 text-sm mb-2 uppercase tracking-wider">Release Date</p>
                                            <p className="text-xl font-semibold">{selectedGame.release_date}</p>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                            <p className="text-gray-500 text-sm mb-2 uppercase tracking-wider">Platform</p>
                                            <p className="text-xl font-semibold">{selectedGame.platform}</p>
                                        </div>
                                    </motion.div>

                                    {/* Play Button */}
                                    <motion.a
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        href={selectedGame.game_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full px-10 py-6 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-2xl font-bold text-xl text-center transition-all shadow-2xl shadow-pink-500/30"
                                    >
                                        Play Now →
                                    </motion.a>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <footer className="relative py-12 border-t border-white/5 w-full">
    <div className="container mx-auto px-4 lg:px-8 max-w-7xl w-full">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center"
                        >
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Gamepad2 className="w-6 h-6 text-pink-500" />
                                <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                                    GameVoyage
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm">
                                Your journey through the gaming universe
                            </p>
                            <p className="text-gray-600 text-xs mt-4">
                                © 2025 GameVoyage. All rights reserved.
                            </p>
                        </motion.div>
                    </div>
                </footer>
                {/* Auth Modal */}
                <AuthModal 
                    show={showAuthModal} 
                    onClose={() => setShowAuthModal(false)}
                    initialMode={authMode}
                />
            </div>

            <style>{`
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    @keyframes pulse {
        0%, 100% { opacity: 0.1; }
        50% { opacity: 0.2; }
    }
`}</style>
        </>
    );
}