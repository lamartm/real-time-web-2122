# Game Rater
![image](https://user-images.githubusercontent.com/55801193/168215387-174360fd-ace1-446d-9b55-8dcbaaedf2dd.png)
## Link 🔗
[Live link](https://rtw-ml.herokuapp.com/)

## App beschrijving 📱
Met Game Rater kan je tegen je vrienden raden welke spel hoger beoordeeld is. De speler die het snelsts antwoord krijgt een punt. Speel tot 5 punten om uiteindelijk te winnen!

## Drie concepten ☘️

![image](https://user-images.githubusercontent.com/55801193/168216088-7ada2695-eb20-482d-be03-850af27156d8.png)
 Mijn eerste concept was een guess that pokemon game waar je tegen je vrienden kan raden wie de pokemon is. Ik wou dit in eerste instantie uitwerken, maar ik bedacht me uiteindelijk om een ander concept uit te werken.
 
![image](https://user-images.githubusercontent.com/55801193/168216097-b9cb59fd-4411-48d4-be6d-ffcd2e63d148.png)
Mijn tweede concept was eigenlijk hetzelfde als het Pokemon concept alleen nu doe ik het met voetbal spelers. Toen ik ging kijken naar de API die ik hiervoor nodig had, kreeg ik niet de data die ik wou. Ik wou niet dat je een voetbal speler zou zien van een derde divisie team, maar eerder een speler van de Premier League. Door deze complicaties besloot ik voor een ander concept te gaan.

![image](https://user-images.githubusercontent.com/55801193/168216102-936e9814-b565-4752-a01f-b386ac018434.png)
Mijn derde concept was uiteindelijk de Game Rater. Twee spelers moeten een spel kiezen die een hogere rating heeft. Degene die het goed heeft krijgt een punt. Zodra een speler 5 punten heeft, hebben ze gewonnen en is het spel afgelopen.

## Features 🪂
- Spelen met meerdere users in een room
- Game data gefetched met naam en image
- Speler kan kiezen welke spel een hogere rating heeft
- Geeft feedback aan elke gebruiker wie het goed had en daarna gaat het spel verder
- Als je het niet correct hebt krijg je een scherm te zien dat je het fout had en je nu wacht op de resterende spelers
- Mogelijkheid om te chatten tijdens het spelen
- Stuurt message aan elke gebruiker over wie er gewonnen heeft, na 3 seconden is de room verwijderd en verstuur ik de gebruiker naar de main page

## API ✨
Ik heb voor dit project de [RAWG API](https://rawg.io/apidocs) gebruikt. Dit is een extensieve video game database API waarvan je data kan opvragen van welk game dan ook. Ik heb de [games](https://api.rawg.io/docs/#tag/games) parameter gebruikt met de API om de informatie over de games te krijgen.

## API response 🤖
Als je een standaard request zou maken naar de API met de game tag dan krijg je het volgende terug:
```
{
      slug: 'hollow-knight', //naam van spel
      name: 'Hollow Knight', //naam van spel
      playtime: 6, //hoe lang het duurt om af te maken
      platforms: [Array], //op welke platforms het gereleased is
      stores: [Array], //welke winkels het gereleased is
      released: '2017-02-23', //release datum
      tba: false, // of het nog announced moet worden
      background_image: 'https://media.rawg.io/media/games/4cf/4cfc6b7f1850590a4634b08bfab308ab.jpg', // een image ervan
      rating: 4.4, // rating van de api van 5 tot 5
      rating_top: 5, // max rating
      ratings: [Array], // rating van gebruikers
      ratings_count: 1953, // aantal ratings
      reviews_text_count: 23, // hoeveel text reviews er zijn op de site
      added: 8190, // hoeveel mensen het hebben toegevoegd aan hun lijst op de site
      added_by_status: [Object], // toegevoegd op status
      metacritic: 88, // metacritic rating
      suggestions_count: 505, // hoe vak het gesuggest wordt
      updated: '2022-03-24T08:14:52', // laast geupdate 
      id: 9767, // id van spel
      score: null, 
      clip: null,
      tags: [Array], // genre tags
      esrb_rating: [Object], // esrb leeftijd rating
      user_game: null,
      reviews_count: 1989, //hoeveelheid reviews
      saturated_color: '0f0f0f',
      dominant_color: '0f0f0f',
      short_screenshots: [Array],
      parent_platforms: [Array],
      genres: [Array] 
    },
```

## Hoe ik het heb gebruikt 📜
Ik heb van de data het volgende meegenomen om te gebruiken in mijn app:
- name: Hierdoor weet ik hoe het spel heet
- background_image: Met dit kan ik een image laten zien aan de gebruiker
- metacritic: Hierdoor weet ik hoe hoog het spel is beoordeeld

## Gebruikte parameters 🔍
Om precies de data te krijgen die ik wil heb ik de volgende parameters toegevoegd aan de API call:
 ```
 page_size=40 // Dit is de max die ik uit een request kan halen qua games resultaten
 metacritic=60,100 // Om het spel wat meer uitdagend te maken kies ik games die een rating van 60 tot 100 gaan.
 dates=2014-01-01,${date} // Hiermee geef ik aan dat ik spelen wil die uitgebracht waren van 2014 tot de huidige dag. De huidige dag is ${date} variabel die ik toevoeg
 ```
 
 ## API Key 🔑
 Als je de API wilt gebruiken moet je een API key aanvragen. Dit kan door eerst een [account the maken bij RAWG](https://rawg.io/login?forward=developer) en vervolgens een API key aan te vragen.
 
 ## Data lifecycle diagram
 ![rtw data](https://user-images.githubusercontent.com/55801193/168220099-e7987dc7-0f76-4a0f-ba2f-8767d82f3c21.jpg)
 
 ## Real-time events ⏱️
 ### page-load 🎊
 Zodra de gebruiker hun gebruikersnaam en room hebben ingevoerd is er een post request gevuurd waar dit meegestuurd wordt. Zodra de pagina geladen wordt, worden deze gegevens meegestuurd naar mijn page-load socket event. Hierdoor kan ik met deze gegevens checken of de gebruiker al bestaat in de database, de game data inloaden. en de leaderboard maken en updaten in het geval er nog een speler joined. 
 
### sendCurrentRoom 🪀
De sendCurrentRoom socket event wordt elke keer gevuurd zodra de gebruiker iets heeft beantwoord. Deze event emit dan de updateScore socket event aan de client die de data van de gebruiker die geclicked heeft meestuurd. Als de client die data binnen krijgt checkt het wat de score is, en voegt het een punt toe als ze gelijk hebben. Wanneer dit het geval is wordt dan de updatePoints socket event emit naar de server.

### updatePoints 🧨
De updatePoints socket event update de punten die de gebruiker die geclicked heeft, maar dan in de database
 
### scores 💎
Elke keer als de gebruiker een game selecteerd en een punt scoort of ongelijk heeft, wordt dit socket event gevuurd. Hierdoor kan ik de leaderboard updaten met de score die de gebruiker op dat moment dan heeft

### updateAnswer 🔋
Wanneer de gebruiker gelijk of ongelijk heeft wordt de answer waarde die gelinked is aan hun user data in de database geupdate. Hierdoor weet ik wat voor message ik de gebruiker moet laten zien in het geval ze gelijk of ongelijk hebben.

### updateMessage 🏮
De updateMessage socket event wordt gevuurd elke keer wanneer de gebruiker iets verkeerd heeft, goed of als een van de gebruikers gewonnen heeft. De tekst van de message verandert gebasseerd op welk van de 3 states het is.

### show-games
Verandert het spel die getoond wordt en checkt of er minder dan 2 spelers in een room zitten, zo ja laat die ene speler een bericht zien dat ze wachten op een andere speler

### endGame 🕯️
Als iemand gewonnen heeft, emit ik de gameWon socket event naar de client die dan een message laat zien elke gebruiker in de room dan x speler gewonnen heeft. Met een setTimeout verstuur ik elke gebruiker weer terug naar de homepage. Als iemand gewonnen heeft, verwijder ik elke user met die specifieke room uit de database

### send-msg 🕯️
Verstuurd een text bericht die door een gebruiker is ingevuld naar alle andere gebruikers in dezelfde room

### changeMessage ⚾
Veranderd het pop up bericht die een of meerdere gebruikers zien

### changeData 🎯
Verandert het spel die getoond wordt

### checkForAnswer 🧩
Checked of beide spelers het niet goed hebben, waardoor het spel weer verder gaat voor beide clients


## Installation 💾

Clone naar je computes

```git clone https://github.com/lamartm/real-time-web-2122.git```

Install

```npm install```

Run

```npm start```

## Sources 📗
https://rawg.io/apidocs

https://socket.io/docs/v4/

https://www.youtube.com/watch?v=ZKEqqIO7n-k&ab_channel=WebDevSimplified
