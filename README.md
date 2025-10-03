# Drug Warz

A faithful React remake of the classic DopeWars game, originally created by John E. Dell and later enhanced by Ben Webb.

## Game Overview

DopeWars is a drug dealing simulation game where you play as a street dealer trying to make money and pay off your debt. The game takes place in New York City with various locations, each with different drug prices and police presence levels.

## How to Play

### Objective
- Start with $2,000 cash and $5,000 debt
- Make money by buying drugs cheap and selling them expensive
- Pay off your debt before it accumulates too much interest
- Survive encounters with cops and other dealers

### Game Mechanics

#### Locations
- **Manhattan**: Moderate police presence, good for beginners
- **Brooklyn**: Higher police presence, but good prices
- **Queens**: Moderate danger, decent prices
- **Bronx**: Very dangerous, but drugs are cheaper
- **Staten Island**: Safest area, but higher prices
- **Ghetto**: Most dangerous, cheapest drugs

#### Drugs
- 12 different types of drugs with varying price ranges
- Prices fluctuate randomly
- Some drugs may be "CHEAP" (50% off) or "EXPENSIVE" (200% markup)
- Buy when cheap, sell when expensive

#### Special Locations
- **Bank**: Deposit money to keep it safe from cops
- **Loan Shark**: Take loans or pay off debt (10% interest per turn)
- **Gun Shop**: Buy weapons for protection
- **Hospital**: Heal wounds ($10 per health point)

#### Combat & Survival
- Police encounters can damage your health
- Guns provide protection and combat abilities
- Health can be restored at the hospital
- Death occurs at 0 health

## Installation & Running

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Game Controls

- **Drug Market**: Buy and sell drugs
- **Special Locations**: Access banks, hospitals, etc.
- **Location Panel**: Travel between different areas
- **Inventory**: View your drugs and weapons
- **Next Turn**: Advance the game day and trigger events

## Features Implemented

- ✅ Complete drug trading system
- ✅ Location-based gameplay with police presence
- ✅ Bank and loan shark mechanics
- ✅ Gun shop and combat preparation
- ✅ Hospital and healing system
- ✅ Dynamic drug pricing with fluctuations
- ✅ Inventory management
- ✅ Turn-based gameplay with events
- ✅ Retro terminal-style UI

## Game Tips

1. **Start Safe**: Begin in Manhattan or Staten Island
2. **Watch Prices**: Look for CHEAP and EXPENSIVE indicators
3. **Manage Space**: Your coat has limited capacity
4. **Bank Money**: Keep cash safe from cops
5. **Buy Weapons**: Guns help in dangerous areas
6. **Pay Debt**: Interest accumulates quickly
7. **Heal Often**: Low health is dangerous

## Technical Details

- Built with React 18
- Uses React Context for state management
- Styled with styled-components
- Responsive grid layout
- Real-time price updates

## License

MIT License - Feel free to modify and distribute.

## Credits

- Original DopeWars by John E. Dell
- Enhanced version by Ben Webb
- React remake created for educational purposes
