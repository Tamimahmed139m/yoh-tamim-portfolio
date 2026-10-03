import React from 'react';
import { Game } from '../../types/game';
import { Game3DSlopeTunnel } from './BuiltinGames/Game3DSlopeTunnel';
import { Game3DBowling } from './BuiltinGames/Game3DBowling';
import { Game3DCarRacer } from './BuiltinGames/Game3DCarRacer';
import { GameColorWaterSort } from './BuiltinGames/GameColorWaterSort';
import { GameCutTheRope } from './BuiltinGames/GameCutTheRope';
import { GameParkingJam } from './BuiltinGames/GameParkingJam';
import { GamePopIt3D } from './BuiltinGames/GamePopIt3D';
import { GameSupermarketCashier } from './BuiltinGames/GameSupermarketCashier';
import { GameFruitNinja } from './BuiltinGames/GameFruitNinja';
import { Game8BallPool } from './BuiltinGames/Game8BallPool';
import { GamePianoTiles } from './BuiltinGames/GamePianoTiles';
import { GameDrawPuzzle } from './BuiltinGames/GameDrawPuzzle';
import { Game2048 } from './BuiltinGames/Game2048';
import { GameHextris } from './BuiltinGames/GameHextris';
import { GameKnifeRain } from './BuiltinGames/GameKnifeRain';
import { GameWordSearch } from './BuiltinGames/GameWordSearch';
import { GameMemoryCard } from './BuiltinGames/GameMemoryCard';
import { GameNeonRunner } from './BuiltinGames/GameNeonRunner';
import { GameBubbleShooter } from './BuiltinGames/GameBubbleShooter';
import { GameFlappy } from './BuiltinGames/GameFlappy';
import { GameRacer } from './BuiltinGames/GameRacer';
import { GamePenaltyShoot } from './BuiltinGames/GamePenaltyShoot';
import { GameKitchenChef } from './BuiltinGames/GameKitchenChef';
import { GameMakeoverStudio } from './BuiltinGames/GameMakeoverStudio';
import { GameSpaceShooter } from './BuiltinGames/GameSpaceShooter';
import { GameStackTower } from './BuiltinGames/GameStackTower';
import { GameClassicBoard } from './BuiltinGames/GameClassicBoard';

interface PlayableEngineDispatcherProps {
  game: Game;
  gameKey: number;
}

export const PlayableEngineDispatcher: React.FC<PlayableEngineDispatcherProps> = ({
  game,
  gameKey,
}) => {
  // If game has uploaded custom HTML source, run it directly
  if (game.customSourceHtml) {
    return (
      <iframe
        key={gameKey}
        title={game.title}
        srcDoc={game.customSourceHtml}
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full border-0 block"
      />
    );
  }

  const titleLower = game.title.toLowerCase();
  const slugLower = game.slug.toLowerCase();
  const catLower = game.category.toLowerCase();

  // 1. GENUINE 3D WEBGL CAR RACING (Three.js 3D Highway / Arena / Traffic Racer)
  if (
    titleLower.includes('cars arena') ||
    titleLower.includes('traffic tom') ||
    titleLower.includes('highway rider') ||
    titleLower.includes('drift dudes') ||
    titleLower.includes('drift cup') ||
    titleLower.includes('speed master') ||
    titleLower.includes('racing monster trucks') ||
    titleLower.includes('thug racer') ||
    titleLower.includes('drag racing') ||
    titleLower.includes('e-scooter') ||
    (catLower === 'racing' && (titleLower.includes('3d') || titleLower.includes('arena') || titleLower.includes('speed')))
  ) {
    return <Game3DCarRacer key={gameKey} title={game.title} />;
  }

  // 2. GENUINE 3D WEBGL GAMES (Three.js 3D Slope / Tunnel / Rolling Sphere)
  if (
    titleLower.includes('slope') ||
    titleLower.includes('tunnel') ||
    titleLower.includes('ramp') ||
    titleLower.includes('cubito') ||
    titleLower.includes('color tunnel') ||
    titleLower.includes('green ball') ||
    titleLower.includes('go around') ||
    titleLower.includes('rolling') ||
    titleLower.includes('stair race')
  ) {
    return <Game3DSlopeTunnel key={gameKey} title={game.title} />;
  }

  // 3. GENUINE 3D WEBGL BOWLING & BALL PHYSICS (Three.js 3D Bowling, Cannon Balls 3D, Curve Ball 3D)
  if (
    titleLower.includes('bowling') ||
    titleLower.includes('cannon ball') ||
    titleLower.includes('curve ball') ||
    titleLower.includes('3d darts') ||
    titleLower.includes('3d air hockey') ||
    titleLower.includes('3d basketball')
  ) {
    return <Game3DBowling key={gameKey} title={game.title} />;
  }

  // 4. CUT THE ROPE & OM NOM (Interactive Rope Slicing Physics)
  if (
    titleLower.includes('cut the rope') ||
    titleLower.includes('om nom') ||
    slugLower.includes('cut-the-rope') ||
    titleLower.includes('feed')
  ) {
    return <GameCutTheRope key={gameKey} title={game.title} />;
  }

  // 5. COLOR WATER SORT 3D & LIQUID SORTING PUZZLES
  if (
    titleLower.includes('water sort') ||
    titleLower.includes('sort it') ||
    titleLower.includes('dye hard') ||
    titleLower.includes('sort bird') ||
    titleLower.includes('tap my water')
  ) {
    return <GameColorWaterSort key={gameKey} title={game.title} />;
  }

  // 6. PARKING JAM & CAR UNBLOCKING PUZZLE
  if (
    titleLower.includes('parking jam') ||
    titleLower.includes('parking panic') ||
    titleLower.includes('parking rush') ||
    titleLower.includes('parking passion') ||
    titleLower.includes('park your car') ||
    titleLower.includes('car crossing') ||
    titleLower.includes('bus parking')
  ) {
    return <GameParkingJam key={gameKey} title={game.title} />;
  }

  // 7. POP IT! 3D & SENSORY FIDGET POPPING
  if (
    titleLower.includes('pop it') ||
    titleLower.includes('fidget spinner') ||
    titleLower.includes('pop pop')
  ) {
    return <GamePopIt3D key={gameKey} title={game.title} />;
  }

  // 8. SUPERMARKET SIMULATOR & CASHIER SCANNER
  if (
    titleLower.includes('supermarket') ||
    titleLower.includes('good shelves') ||
    titleLower.includes('fast food takeaway') ||
    titleLower.includes('store manager')
  ) {
    return <GameSupermarketCashier key={gameKey} title={game.title} />;
  }

  // 9. FRUIT NINJA & SWIPE BLADE SLICING
  if (
    titleLower.includes('katana') ||
    titleLower.includes('fruit party') ||
    titleLower.includes('fruit break') ||
    titleLower.includes('slice rush') ||
    titleLower.includes('ninja 3') ||
    titleLower.includes('fruit pulp')
  ) {
    return <GameFruitNinja key={gameKey} title={game.title} />;
  }

  // 10. 8 BALL POOL & BILLIARDS TABLE
  if (
    titleLower.includes('billiard') ||
    titleLower.includes('8 ball') ||
    titleLower.includes('pool')
  ) {
    return <Game8BallPool key={gameKey} title={game.title} />;
  }

  // 11. PIANO TILES & MUSICAL RHYTHM
  if (
    titleLower.includes('piano') ||
    titleLower.includes('dance battle')
  ) {
    return <GamePianoTiles key={gameKey} title={game.title} />;
  }

  // 12. DRAW LINE & INK PHYSICS PUZZLE
  if (
    titleLower.includes('dunk brush') ||
    titleLower.includes('block painter') ||
    titleLower.includes('color roll') ||
    titleLower.includes('peet around') ||
    titleLower.includes('go escape')
  ) {
    return <GameDrawPuzzle key={gameKey} title={game.title} />;
  }

  // 13. 2048 & NUMBER MERGE PUZZLES
  if (
    titleLower.includes('2048') ||
    titleLower.includes('cube match') ||
    titleLower.includes('1010') ||
    titleLower.includes('1212') ||
    titleLower.includes('merge') ||
    titleLower.includes('get 10')
  ) {
    return <Game2048 key={gameKey} title={game.title} />;
  }

  // 14. HEXTRIS & ROTATIONAL HEXAGON MATCHING
  if (
    titleLower.includes('hextris') ||
    titleLower.includes('hex zen') ||
    titleLower.includes('hex blitz') ||
    titleLower.includes('hex puzzle') ||
    titleLower.includes('twisty')
  ) {
    return <GameHextris key={gameKey} />;
  }

  // 15. KNIFE RAIN & NEEDLE WHEEL PRECISION
  if (
    titleLower.includes('knife') ||
    titleLower.includes('color pin') ||
    titleLower.includes('pin') ||
    titleLower.includes('lock') ||
    titleLower.includes('dart')
  ) {
    return <GameKnifeRain key={gameKey} title={game.title} />;
  }

  // 16. WORD SEARCH & CROSSWORDS
  if (
    titleLower.includes('word') ||
    titleLower.includes('quiz') ||
    titleLower.includes('text') ||
    titleLower.includes('guess') ||
    titleLower.includes('trivia') ||
    titleLower.includes('hangman') ||
    catLower === 'word'
  ) {
    return <GameWordSearch key={gameKey} title={game.title} category={game.category} />;
  }

  // 17. MEMORY CARDS & HERO MATCHING
  if (
    titleLower.includes('memory') ||
    titleLower.includes('card hero') ||
    titleLower.includes('pair up') ||
    titleLower.includes('easter card') ||
    titleLower.includes('find 500')
  ) {
    return <GameMemoryCard key={gameKey} title={game.title} category={game.category} />;
  }

  // 18. FLAPPY & OBSTACLE FLIGHT
  if (
    titleLower.includes('flappy') ||
    titleLower.includes('bird') ||
    titleLower.includes('flight') ||
    titleLower.includes('plane') ||
    titleLower.includes('ufo') ||
    titleLower.includes('flying') ||
    titleLower.includes('wing')
  ) {
    return <GameFlappy key={gameKey} title={game.title} category={game.category} />;
  }

  // 19. BUBBLE SHOOTER & JEWEL MATCH 3
  if (
    titleLower.includes('bubble') ||
    titleLower.includes('jewel') ||
    titleLower.includes('crush') ||
    titleLower.includes('blast') ||
    titleLower.includes('candy') ||
    catLower === 'match 3'
  ) {
    return <GameBubbleShooter key={gameKey} title={game.title} category={game.category} />;
  }

  // 20. HIGHWAY RACER & DRIFT
  if (
    titleLower.includes('race') ||
    titleLower.includes('racing') ||
    titleLower.includes('car') ||
    titleLower.includes('drift') ||
    titleLower.includes('moto') ||
    titleLower.includes('drive') ||
    titleLower.includes('traffic') ||
    titleLower.includes('truck') ||
    catLower === 'racing'
  ) {
    return <GameRacer key={gameKey} title={game.title} />;
  }

  // 21. SPORTS & PENALTY & BASKETBALL
  if (
    titleLower.includes('penalty') ||
    titleLower.includes('soccer') ||
    titleLower.includes('football') ||
    titleLower.includes('basketball') ||
    titleLower.includes('dunk') ||
    titleLower.includes('hoop') ||
    titleLower.includes('kick') ||
    titleLower.includes('goalkeeper') ||
    catLower === 'sports'
  ) {
    return <GamePenaltyShoot key={gameKey} title={game.title} />;
  }

  // 22. KITCHEN CHEF & COOKING
  if (
    titleLower.includes('cooking') ||
    titleLower.includes('kitchen') ||
    titleLower.includes('chef') ||
    titleLower.includes('pizza') ||
    titleLower.includes('burger') ||
    titleLower.includes('cake') ||
    titleLower.includes('kebab') ||
    catLower === 'cooking'
  ) {
    return <GameKitchenChef key={gameKey} title={game.title} />;
  }

  // 23. MAKEOVER STUDIO & DRESS UP
  if (
    titleLower.includes('dress up') ||
    titleLower.includes('makeup') ||
    titleLower.includes('make up') ||
    titleLower.includes('fashion') ||
    titleLower.includes('beauty') ||
    titleLower.includes('lily') ||
    titleLower.includes('wedding') ||
    titleLower.includes('salon') ||
    catLower === 'girls' ||
    catLower === 'dress up'
  ) {
    return <GameMakeoverStudio key={gameKey} title={game.title} />;
  }

  // 24. SPACE & LASER CANNON SHOOTER
  if (
    titleLower.includes('sniper') ||
    titleLower.includes('shoot') ||
    titleLower.includes('alien') ||
    titleLower.includes('gun') ||
    titleLower.includes('cannon') ||
    titleLower.includes('tank') ||
    titleLower.includes('attack') ||
    titleLower.includes('war') ||
    titleLower.includes('fight') ||
    titleLower.includes('hero') ||
    catLower === 'shooting' ||
    catLower === 'action'
  ) {
    return <GameSpaceShooter key={gameKey} title={game.title} />;
  }

  // 25. TOWER & BLOCK STACK
  if (
    titleLower.includes('tower') ||
    titleLower.includes('stack') ||
    titleLower.includes('smash') ||
    titleLower.includes('fall') ||
    titleLower.includes('drop') ||
    titleLower.includes('bounce') ||
    titleLower.includes('bottle flip') ||
    titleLower.includes('rise up') ||
    catLower === 'hyper casual'
  ) {
    return <GameStackTower key={gameKey} title={game.title} />;
  }

  // 26. SOLITAIRE & CARDS & BOARD TABLE
  if (
    titleLower.includes('solitaire') ||
    titleLower.includes('mahjong') ||
    titleLower.includes('chess') ||
    titleLower.includes('checkers') ||
    titleLower.includes('backgammon') ||
    titleLower.includes('domino') ||
    titleLower.includes('card') ||
    catLower === 'board' ||
    catLower === 'card' ||
    catLower === 'solitaire'
  ) {
    return <GameClassicBoard key={gameKey} title={game.title} />;
  }

  // 27. DEFAULT FALLBACK BASED ON CATEGORY OR NEON RUNNER
  if (catLower === 'racing') return <Game3DCarRacer key={gameKey} title={game.title} />;
  if (catLower === 'sports') return <GamePenaltyShoot key={gameKey} title={game.title} />;
  if (catLower === 'cooking') return <GameKitchenChef key={gameKey} title={game.title} />;
  if (catLower === 'girls' || catLower === 'dress up') return <GameMakeoverStudio key={gameKey} title={game.title} />;
  if (catLower === 'shooting' || catLower === 'action') return <GameSpaceShooter key={gameKey} title={game.title} />;
  if (catLower === 'puzzle') return <GameDrawPuzzle key={gameKey} title={game.title} />;

  return <GameNeonRunner key={gameKey} title={game.title} category={game.category} />;
};
