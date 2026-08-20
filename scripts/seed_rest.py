#!/usr/bin/env python3
"""Write remaining chapter JSON from Hall's arguments; mark catalog ready."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT = json.loads((ROOT / "data" / "catalog.json").read_text(encoding="utf-8"))
BY_ID = {c["id"]: c for c in CAT["chapters"]}

# thesis / points / translation / rite / see_also / correspondences
COPY = {
    "preface": dict(
        see_also=["introduction", "conclusion", "about-author"],
        correspondences=["folio", "knapp", "1928"],
        rite=("How many years of almost uninterrupted work does Hall say went into the text?", ["two", "two years", "over two years"]),
        thesis="The folio is a two-year attempt to give the mystery teachings a body worthy of them — beauty and truth in one binding.",
        points=["Work on the text began 1 Jan 1926", "No footnotes; quotations live in the prose", "Knapp's color plates are part of the argument", "Paid for by subscribers, not a commercial house", "Hall claims neither infallibility nor originality"],
        tr="Hall's preface is a builder's log. He started the manuscript on New Year's Day 1926 and sat with it for more than two years, after years of collecting. He killed the footnotes so the page would read as one argument. The color plates by J. Augustus Knapp are not decoration; they are how the book thinks. Subscribers paid in advance because Hall could not. He will not pretend the ancients left a clean system, and he will not pretend he invented one. The rest of the folio is that honesty at encyclopedia scale.",
    ),
    "introduction": dict(
        see_also=["preface", "pythagoras", "qabbalah", "conclusion"],
        correspondences=["philosophy", "value", "silence"],
        rite=("Hall quotes Pythagoras's first discipline for disciples. What is it?", ["silence", "the discipline of silence"]),
        thesis="Philosophy is the science of estimating values: what remains when the secondary is stripped away.",
        points=["Six headings: metaphysics, logic, ethics, psychology, epistemology, aesthetics", "Bacon: a little philosophy inclineth to atheism; depth bringeth round to religion", "Pythagoras required silence before teaching", "The schools of Ionia and Italy as first maps", "Modern isms fight each other and drop the sublime issues"],
        tr="The introduction is Hall's operating system. Philosophy, for him, is not a department. It is how you decide what matters when everything secondary is gone. He runs through the usual six headings, then quotes Bacon against the half-educated skeptic, then Pythagoras against the man who will not sit still. The Ionic and Italic schools are there as a first atlas: fire, air, number, the music of the spheres. The rest of the book will keep scoring traditions by whether they still estimate values, or only argue with their neighbors.",
    ),
    "mysteries-1": dict(
        see_also=["mysteries-2", "mysteries-3", "freemasonic", "sun"],
        correspondences=["mithras", "druid", "rite", "masonry"],
        rite=("Which Persian mystery cult does Hall contrast with the Christian mysteries in Part I?", ["mithras", "mithraic", "the rites of mithras"]),
        thesis="Secret societies of the ancient world taught by rite, not lecture; modern Masonry inherited the furniture.",
        points=["Education as initiation", "Celsus against the Christians", "Druidic mysteries of Britain and Gaul", "Mithras and the tauroctony", "Mithraic and Christian mysteries contrasted"],
        tr="Part I is Hall's claim that the West was educated in caves and groves before it was educated in classrooms. The Druids, Mithras, and the other closed rooms taught a curriculum you walked. Celsus is quoted because Hall wants the pagan charge on the table: that Christianity borrowed a mystery and then denied the borrowing. The Mithraic contrast is the point of the chapter — same solar furniture, different story about who dies. Later Masonic symbolism, for Hall, is that furniture still in the lodge.",
    ),
    "mysteries-2": dict(
        see_also=["mysteries-1", "mysteries-3", "qabbalah", "apocalypse"],
        correspondences=["gnostic", "abraxas", "labyrinth", "odin"],
        rite=("What Gnostic name for deity does Hall flag in Part II?", ["abraxas"]),
        thesis="Gnostics, Serapis, the labyrinth, and the Odinic north: heresy as a filing system for stolen light.",
        points=["Simon Magus and Basilides", "Abraxas as a compound deity", "Mysteries of Serapis", "Labyrinth symbolism", "Odinic or Gothic mysteries"],
        tr="Part II is the heretics' shelf. Hall treats Gnosticism as a rival mystery school, not a footnote to orthodoxy: Simon, Basilides, Abraxas as a deity you can count. Serapis is Egypt under a Greek mask. The labyrinth is a walkable doctrine — you are not told the center; you are made to take the path. Then he swings north to Odin, because he will not let 'mystery' mean only the Mediterranean. The chapter's job is to show that 'secret society' is a family, not a franchise.",
    ),
    "mysteries-3": dict(
        see_also=["mysteries-1", "atlantis", "chemical-marriage", "tabernacle"],
        correspondences=["eleusis", "orpheus", "dionysus", "lesser rites"],
        rite=("What Greek town's rites does Hall divide into Lesser and Greater?", ["eleusis", "eleusinian", "the eleusinian mysteries"]),
        thesis="Eleusis, Orpheus, Bacchus, Dionysus: dying gods you do not describe to the uninitiated.",
        points=["Eleusinian lesser and greater rites", "Orphic mysteries", "Bacchic mysteries", "Dionysiac architects later", "Secrecy as pedagogy"],
        tr="Part III is the Greek core. Eleusis has two gates: the lesser rites that prepare, the greater that you are forbidden to narrate. Orpheus, Bacchus, Dionysus are the same dying-and-returning pattern Hall will later hang on Hiram, Osiris, and the year. He is assembling a comparative table. The point is not that the Greeks were Masons. The point is that a rite can carry a cosmology you cannot lecture.",
    ),
    "atlantis": dict(
        see_also=["mysteries-3", "isis", "sun", "hiramic"],
        correspondences=["atlantis", "tammuz", "adonis", "dying god"],
        rite=("Which dying-god pair from Babylon does Hall name beside Atlantis?", ["tammuz and ishtar", "tammuz", "ishtar"]),
        thesis="Plato's island and the dying god are one file: a world that sinks, a god that is buried, a rite that remembers both.",
        points=["Plato's Atlantis against 'modern science'", "Tammuz and Ishtar", "Atys and Adonis", "Sabazius", "Cabiri of Samothrace"],
        tr="Hall is not doing geology. Atlantis, here, is the type of a world that went under and left a rite. He stacks the dying-god file on it: Tammuz, Adonis, Atys, the Cabiri. Each is a calendar as much as a person — a year that must be killed and raised. Later the Hiramic legend will sit on this same card. Read the chapter as Hall's first full statement of the pattern the whole folio repeats.",
    ),
    "isis": dict(
        see_also=["hermes", "atlantis", "sun", "bembine"],
        correspondences=["isis", "osiris", "mummy", "virgin"],
        rite=("Who is murdered in the myth Hall retells as the backbone of this chapter?", ["osiris"]),
        thesis="Isis is the world-soul in a woman's name; Osiris is the light cut up and reassembled.",
        points=["Birthdays of the gods", "Murder of Osiris", "Hermetic Isis", "Symbols peculiar to Isis", "Mummification as a doctrine of the body"],
        tr="Isis, for Hall, is not a museum statue. She is the world as a womb and a widow. Osiris is dismembered; the pieces are the world's scattered light; Isis gathers them. That is the same story as Hiram and the year, in Egyptian dress. The mummy is not a horror prop. It is a claim about what a body is for after the rite. The 'virgin of the world' is Hall's way of saying nature is both mother and initiate.",
    ),
    "sun": dict(
        see_also=["zodiac", "hiramic", "mystic-christianity", "cross"],
        correspondences=["sun", "solstice", "christmas", "midnight sun"],
        rite=("What Christian feast does Hall treat as a sun-birth?", ["christmas", "the birthday of the sun"]),
        thesis="The sun is the one deity every temple kept, whatever name was painted on the door.",
        points=["Solar trinity", "Christianity and the sun", "Birthday of the sun", "Three suns", "The midnight sun"],
        tr="This is Hall's most blunt comparative chapter. The sun dies at the winter solstice and is born when the days lengthen. Christmas sits on that hinge. A solar trinity (rising, noon, setting; or three suns in some alchemical talk) is how you get three persons out of one lamp. The midnight sun is the sun that still shines when the world looks dark — initiation language. He is not trying to insult Christianity. He is filing it in the solar cabinet with everyone else.",
    ),
    "zodiac": dict(
        see_also=["sun", "bembine", "tarot", "pythagorean-math"],
        correspondences=["zodiac", "equinox", "ages", "tentyra"],
        rite=("Which Egyptian circular zodiac does Hall interpret?", ["tentyra", "dendera", "the circular zodiac of tentyra"]),
        thesis="The belt of living signs is a clock for world-ages, not a newspaper horoscope.",
        points=["Primitive astronomical instruments", "Equinoxes and solstices", "Astrological ages", "Circular zodiac of Tentyra (Dendera)", "Horoscope of the world"],
        tr="Hall wants the zodiac back from the fairground. Equinoxes and solstices are the hinges of the year; the signs are a language for those hinges. The Dendera circular zodiac is his exhibit: a stone clock. 'Ages of the world' means precession, not personality quizzes. The 'horoscope of the world' is the claim that history itself is a natal chart. Later tarot and the Tree will steal from this same belt of twelve.",
    ),
    "bembine": dict(
        see_also=["isis", "zodiac", "pyramid", "tabernacle"],
        correspondences=["bembine", "orphic egg", "triad", "table of isis"],
        rite=("What object, a bronze tablet of Isis, is this chapter named for?", ["bembine table", "table of isis", "the bembine table"]),
        thesis="The Bembine Table is a bronze filing cabinet: three zodiacs, an Orphic egg, a doctrine you can point at.",
        points=["Plato's initiation in the pyramid (Hall's linking claim)", "History of the Bembine Table", "Platonic theory of ideas", "Three philosophical zodiacs", "Chaldean triads and the Orphic egg"],
        tr="The Bembine Table (Mensa Isiaca) is a Renaissance bronze that pretends to be Egypt. Hall treats it as a map anyway: three zodiacs interacting, Chaldean triads, the Orphic egg as the cosmos before it hatches. Whether the tablet is 'authentic' in an archaeological sense is not his test. His test is whether it still diagrams the same grammar as Isis, the pyramid, and Plato's ideas. This is the folio at its most diagram-hungry.",
    ),
    "wonders": dict(
        see_also=["pyramid", "bembine", "ceremonial-magic", "elements"],
        correspondences=["delphi", "oracle", "seven wonders", "lamps"],
        rite=("Which Greek oracle does Hall list first among the speaking wonders?", ["delphi", "the oracle of delphi"]),
        thesis="The wonders are not tourism. They are machines for a doctrine: lamps that do not go out, mouths that answer, buildings that measure.",
        points=["Ever-burning lamps", "Oracle of Delphi", "Dodona", "Trophonius", "Seven Wonders and initiated architects"],
        tr="Hall files 'wonder' as a technical term. An ever-burning lamp is a claim about fire that does not consume. Delphi is a claim about a voice in a place. The Seven Wonders are a claim that architecture can be a rite. 'Initiated architects' is the bridge to later Masonry: the people who knew the measure. Read it as a cabinet of devices, not a Ripley.",
    ),
    "pythagorean-math": dict(
        see_also=["pythagoras", "music-color", "qabbalah", "keys-to-man"],
        correspondences=["decad", "number", "letter", "eratosthenes"],
        rite=("How many numbers does Hall treat as the Pythagorean decad's sacred set?", ["ten", "the ten numbers", "10"]),
        thesis="Number is not quantity. It is the way being shows up; letters inherit that power.",
        points=["Theory of numbers", "Numerical values of letters", "Numerical power of words", "Sieve of Eratosthenes", "Meanings of the ten numbers"],
        tr="If the Pythagoras chapter is a life, this one is the arithmetic. The decad is a cosmology: 1 the source, 2 the other, 3 the first surface, 4 the solid, 10 the return. Letters get numbers so words can be added. That is the same move later called gematria. Hall is building the bridge from Crotona to the Qabbalah chapter without yet saying Hebrew. The sieve of Eratosthenes is here as a reminder that number also has a craftsman's side.",
    ),
    "human-body": dict(
        see_also=["pythagoras", "tabernacle", "sephiroth", "pyramid"],
        correspondences=["body", "temple", "anthropos", "hand"],
        rite=("Hall calls the human form a philosophical what?", ["manikin", "philosophical manikin"]),
        thesis="The body is a temple diagram: three centers, two sizes of man, an oversoul.",
        points=["Philosophical manikin", "Three universal centers", "Temples of initiation as bodies", "The hand in symbolism", "Greater and lesser man; the Anthropos"],
        tr="Hall reads anatomy as architecture. Temples copy the body; the body copies a larger man. Three centers (head, heart, generative — he will vary the names) are three altars. The hand is a small pentagram you already own. The greater and lesser man is the same idea as Adam Kadmon later: a person-shaped cosmos. When he says 'temple of initiation' he means you are walking through someone.",
    ),
    "music-color": dict(
        see_also=["pythagoras", "pythagorean-math", "zodiac", "stones"],
        correspondences=["music", "color", "spheres", "scale"],
        rite=("What celestial metaphor for harmony does Hall credit to the Pythagoreans?", ["music of the spheres", "the music of the spheres"]),
        thesis="Scale, spectrum, and sky are one ratio written three ways.",
        points=["Diatonic scale", "Therapeutic music", "Music of the spheres", "Color in symbolism", "Spectrum, musical scale, planetary colors"],
        tr="This is why HALL's menubar may retitle itself by planetary hour but must not add a fifth Workbench color. Hall treats the scale and the spectrum as translations of each other, and both as translations of the sky. Planetary colors are not interior-decorating. They are a correspondence table. The 'music of the spheres' is the claim that the world is already in tune; the initiate learns to hear it. Therapeutic music is the practical end: ratio as medicine.",
    ),
    "fishes-1": dict(
        see_also=["fishes-2", "mystic-christianity", "flowers", "elements"],
        correspondences=["fish", "scarab", "serpent", "whale"],
        rite=("Which insect does Hall name as an Egyptian emblem of resurrection?", ["scarab", "the egyptian scarab"]),
        thesis="Animals are walking emblems: fish for the Christ, scarab for rebirth, serpent for wisdom.",
        points=["Jonah and the whale", "Fish as a symbol of Christ", "Egyptian scarab", "Serpent of wisdom", "Sacred crocodile"],
        tr="Hall's bestiary is a dictionary. The fish is a Christ-sign because it already meant life in water, baptism, the vesica. Jonah's whale is a death-and-return machine. The scarab rolls the sun like dung and is therefore resurrection. The serpent is wisdom when it is not merely horror — the same animal, two files. He is teaching you to see a zoo as a grammar.",
    ),
    "fishes-2": dict(
        see_also=["fishes-1", "american-indian", "emissaries", "sun"],
        correspondences=["phoenix", "great seal", "apis", "unicorn"],
        rite=("Which American emblem does Hall read in this animal chapter?", ["great seal", "the great seal of the united states"]),
        thesis="Phoenix, cat, bull, unicorn, and the Great Seal: national heraldry as leftover mystery-language.",
        points=["Dove", "Phoenix", "Great Seal of the United States", "Bast", "Apis and the unicorn"],
        tr="Part II takes the bestiary into politics. The phoenix is the sun that does not stay dead. The Great Seal is Hall's American shock: unfinished pyramid, all-seeing eye, a motto about a new order — he will not let that pass as decoration. Bast and Apis are Egypt's cat and bull still doing their jobs. The unicorn is a gospel of the single horn, the undivided power. Heraldry, for him, is a mystery school that forgot it was one.",
    ),
    "flowers": dict(
        see_also=["fishes-1", "hiramic", "tabernacle", "sephiroth"],
        correspondences=["lotus", "acacia", "yggdrasil", "mandrake"],
        rite=("Which plant marks Hiram's grave in the Masonic legend Hall already told?", ["acacia", "the sprig of acacia"]),
        thesis="Plants are rites that grow: lotus, world-tree, acacia, vine, mandrake.",
        points=["Flower as emblem", "Lotus", "Yggdrasil", "Sprig of acacia", "Grape and mandrake"],
        tr="The lotus opens with the sun. Yggdrasil holds up a world. The acacia on Hiram's grave is the plant that does not die when the master does. The vine is blood and sacrament. The mandrake is a vegetable man, which is why magicians wanted it. Hall's botany is the same comparative method as the bestiary: a garden as a filing system for sex, death, and the axis of the world.",
    ),
    "stones": dict(
        see_also=["music-color", "alchemy-1", "tabernacle", "zodiac"],
        correspondences=["stone", "metal", "grail", "talisman"],
        rite=("What vessel does Hall list among the talismanic relics in this chapter?", ["grail", "holy grail", "the holy grail"]),
        thesis="Stones, metals, and gems are frozen planets: ages of the world you can wear.",
        points=["Prehistoric monuments", "Tablets of the law", "Holy Grail", "Ages of the world", "Talismanic and zodiacal stones"],
        tr="If music-color is ratio in the air, stones are ratio you can put in a pocket. Planetary metals (lead, tin, iron, gold, copper, mercury, silver) are the same Chaldean order HALL already uses for the hour. The Grail is a vessel that holds a doctrine. The tablets of the law are a stone that speaks. Ages of the world in metal (gold, silver, bronze, iron) are a calendar of decline. Talismans are correspondence made portable.",
    ),
    "ceremonial-magic": dict(
        see_also=["elements", "cryptogram", "pharmacology", "rose-cross"],
        correspondences=["pentagram", "faust", "grimoire", "goetia"],
        rite=("Which five-pointed figure does Hall name as the chief symbol of this chapter?", ["pentagram", "the pentagram"]),
        thesis="Magic is a misused temple rite; the grimoire is a wrecked liturgy.",
        points=["Black magic of Egypt", "Faust", "Mephistopheles of the grimoires", "Invocation and pacts", "Pentagram"],
        tr="Hall is not writing a how-to. He treats ceremonial magic as what happens when the mystery's tools are taken off the temple floor and used for private appetite. Faust is the type. The grimoires are leftover liturgies with the names of spirits where the gods were. The pentagram is the human measure (five points, five wounds, five senses) which can face either way. The chapter belongs next to the elements and the pharmacy: same cabinet, darker drawer.",
    ),
    "elements": dict(
        see_also=["ceremonial-magic", "pharmacology", "alchemy-1", "music-color"],
        correspondences=["gnome", "undine", "salamander", "sylph"],
        rite=("Name one of Paracelsus's four elemental peoples Hall lists.", ["gnomes", "undines", "salamanders", "sylphs", "gnome", "undine", "salamander", "sylph"]),
        thesis="Fire, water, air, earth have inhabitants: Paracelsus's elementals as a map of the sublunary.",
        points=["Paracelsian submundanes", "Gnomes, undines, salamanders, sylphs", "Demonology", "Incubus and succubus", "Vampirism as a type"],
        tr="Hall takes Paracelsus at his word long enough to use him. Four elements, four peoples: gnomes in earth, undines in water, salamanders in fire, sylphs in air. That is a correspondence table, not a fairy-tale. Demonology and the incubus file are what happens when the table is moralized into a panic. He is still doing comparative anatomy of the invisible. The later alchemy chapters will need this fourfold.",
    ),
    "pharmacology": dict(
        see_also=["elements", "alchemy-exponents", "ceremonial-magic", "flowers"],
        correspondences=["paracelsus", "herb", "palingenesis", "medicine"],
        rite=("Which physician-alchemist is the spine of this chapter?", ["paracelsus"]),
        thesis="Hermetic medicine treats disease as a correspondence gone wrong; the herb is a small planet.",
        points=["Healing methods of Paracelsus", "Palingenesis", "Cause of disease in hermetic theory", "Medicinal herbs", "Drugs in the mysteries"],
        tr="Paracelsus is Hall's doctor. Disease is not only a lesion; it is a signature. Herbs work because they already wear a planet's face. Palingenesis — raising a plant's ghost from its ash — is the same resurrection pattern as the phoenix, in a flask. Drugs in the mysteries are a reminder that Eleusis was not only words. The Assassins appear as a dark cousin: a sect and a pharmacology. HALL's pharmacy is a mystery school with a dispensary.",
    ),
    "cosmogony": dict(
        see_also=["qabbalah", "sephiroth", "keys-to-man", "introduction"],
        correspondences=["ain soph", "four worlds", "adam kadmon", "cosmic egg"],
        rite=("What name does Hall use for the Infinite before the first sephira?", ["ain soph", "ain soph", "ein sof"]),
        thesis="Before the Tree, the Infinite: Ain Soph, worlds stacked, a Grand Man the size of the universe.",
        points=["Ain Soph and the cosmic egg", "Qabbalistic system of worlds", "Ezekiel's vision", "Nebuchadnezzar's image", "Grand Man; fifty gates"],
        tr="If 'Qabbalah' is the claim, this chapter is the cosmogony. Ain Soph is the Infinite that does not fit a globe. Then worlds unfold (Hall will speak of four). Ezekiel's vision and the dream-image in Daniel are read as the same Grand Man the Tree will later draw. Fifty gates of life are a curriculum. You cannot jump to the sephiroth chapter without this one: it is the empty that the globes hang in.",
    ),
    "keys-to-man": dict(
        see_also=["qabbalah", "pythagorean-math", "cryptogram", "human-body"],
        correspondences=["gematria", "notarikon", "temurah", "adam"],
        rite=("Name one of the three Qabbalistic letter-keys Hall lists.", ["gematria", "notarikon", "temurah"]),
        thesis="Three keys on a locked verse: count it, acronym it, permute it. Then there are four Adams.",
        points=["Gematria, notarikon, temurah", "Elohim", "Four Adams", "Adam as archetype", "Church on marriage as a side file"],
        tr="This is the toolbox chapter for HALL's English gematria door. Gematria counts. Notarikon initials. Temurah shuffles. The four Adams are four layers of the same human (Hall's versions vary by source: heavenly, earthly, and their shadows). Elohim is a plural that Hall will not leave as a grammar accident. Codex, on the lot, already does Hebrew math. This chapter is why HALL's door runs the same idea on Hall's own English.",
    ),
    "tabernacle": dict(
        see_also=["human-body", "stones", "qabbalah", "freemasonic"],
        correspondences=["tabernacle", "ark", "urim", "moses"],
        rite=("What two oracular objects in the high priest's gear does Hall name?", ["urim and thummim", "urim", "thummim"]),
        thesis="The wilderness tabernacle is a portable cosmos: court, holy place, holy of holies as a walkable Tree.",
        points=["Moses as Egyptian initiate", "Building of the tabernacle", "Furnishings", "Ark of the Covenant", "Robes; Urim and Thummim"],
        tr="Hall reads Exodus as a floor plan. Moses comes out of Egypt with a mystery education, then builds a tent that is a world: outer court, inner place, the box you do not open. The ark is a doctrine with rings and poles. Urim and Thummim are a yes-no device on the priest's chest — an oracle you can wear. Later Masonry's temple is this tent in stone. The chapter sits between body-as-temple and lodge-as-temple.",
    ),
    "rose-cross": dict(
        see_also=["rosicrucian-doctrines", "chemical-marriage", "bacon", "alchemy-1"],
        correspondences=["c.r.c.", "andreae", "rose", "cross"],
        rite=("What initials name the mythical founder of the Fraternity in this chapter?", ["crc", "c.r.c.", "christian rosenkreuz", "christian rosencreutz"]),
        thesis="The Rose Cross is a rumor that became a curriculum: a founder, a tomb, a rose on a cross.",
        points=["Life of Father C.R.C.", "Johann Valentin Andreae", "Alchemical teachings", "Rose and cross", "Temple and adepts"],
        tr="Hall tells the Fama's story without needing it to be a newspaper. C.R.C. travels, founds, is buried with objects that teach. Andreae may have written a joke that got out of hand; Hall will still use the joke as a map. The rose is the unfolding; the cross is the fourfold world; together they are a plant on an axis. Alchemy is the inner work of the same emblem. The next chapter is the manifesto; this one is the person.",
    ),
    "rosicrucian-doctrines": dict(
        see_also=["rose-cross", "chemical-marriage", "alchemy-2", "diagrams"],
        correspondences=["confessio", "egg", "three mountains", "fama"],
        rite=("Which Rosicrucian manifesto does Hall name beside the Fama?", ["confessio", "confessio fraternitatis"]),
        thesis="Confessio, egg, three mountains: the Order's public riddles about a work that is not public.",
        points=["Confessio Fraternitatis", "Anatomy of Melancholy as a witness", "John Heydon", "Three mountains of the wise", "Philosophical egg"],
        tr="If the last chapter was a life, this is a creed in riddles. The Confessio talks. Burton's Anatomy notices. Heydon popularizes. The philosophical egg is the work in a shell. The three mountains are a geography of attainment. Hall is not recruiting. He is extracting the same grammar he already found in Eleusis and the Tree: a hidden college, a vessel, a climb.",
    ),
    "diagrams": dict(
        see_also=["sephiroth", "rose-cross", "alchemy-1", "chemical-marriage"],
        correspondences=["schamayim", "tomb", "new jerusalem", "diagram"],
        rite=("Whose symbolic tomb is among the fifteen diagrams Hall lists?", ["christian rosenkreuz", "c.r.c.", "rosencreutz", "christian rosencreutz"]),
        thesis="Fifteen pictures do the work of fifteen chapters: heavens, tomb, city, secret of nature.",
        points=["Schamayim, ocean of spirit", "Seven days of creation", "Tomb of C.R.C.", "Regions of the elements", "New Jerusalem"],
        tr="Hall believes some doctrines only live as pictures. This chapter is a guided tour of plates: the ocean of spirit, creation as a week, the tomb that is a classroom, the four elemental regions, the New Jerusalem as a finished city-diagram. It is the folio's apology for Knapp. Read it with the Tree chapter. One is ten globes; this is fifteen engravings.",
    ),
    "alchemy-exponents": dict(
        see_also=["alchemy-1", "alchemy-2", "pharmacology", "rose-cross"],
        correspondences=["paracelsus", "flamel", "lully", "leopold"],
        rite=("Which Swiss physician-alchemist does Hall list among the exponents?", ["paracelsus"]),
        thesis="Alchemy has biographies: men who treated metals as a moral problem.",
        points=["Multiplication of metals", "Medal of Leopold I", "Paracelsus", "Raymond Lully", "Flamel; Bernard of Treviso"],
        tr="Hall names names so the laboratory has a human temperature. Paracelsus again. Lully. Flamel and the story of the book. Bernard of Treviso. The medal of Leopold is an exhibit: a ruler who wanted the work on a coin. Multiplication of metals is the public scandal of alchemy; Hall will insist the scandal is a cover for a soul-work. The next two chapters are the theory.",
    ),
    "alchemy-1": dict(
        see_also=["alchemy-2", "alchemy-exponents", "hermes", "chemical-marriage"],
        correspondences=["gold", "nature", "art", "solomon"],
        rite=("Hall opposes two workers upon the same matter. Name them.", ["nature and art", "nature", "art"]),
        thesis="Alchemy is nature sped up by art; the gold is a state, not a brick.",
        points=["Origin of alchemical philosophy", "Alexander and the talking trees", "Nature and art", "Alchemical symbolism", "Song of Solomon; Philosopher's Gold"],
        tr="Part I is the thesis of the work. Nature already transmutes (seed to tree, ore to vein). Art is the initiate doing on purpose what nature does slowly. The Song of Solomon is read as a laboratory love-song. Philosopher's Gold is not coin gold — or not only. Symbolism is mandatory because a plain recipe would be the wrong object. Hall is preparing the Emerald Tablet of Part II.",
    ),
    "alchemy-2": dict(
        see_also=["alchemy-1", "hermes", "rose-cross", "chemical-marriage"],
        correspondences=["emerald tablet", "dew", "prayer", "luna"],
        rite=("Which short Hermetic text does Hall quote as an alchemical constitution?", ["emerald tablet", "the emerald tablet", "emerald tablet of hermes"]),
        thesis="Tablet, dew, mountain of the moon: the work in a handful of sentences and a weather.",
        points=["Alchemical prayer", "Emerald Tablet of Hermes", "Letter from the Brothers of R.C.", "Magical mountain of the moon", "Dew of the sages"],
        tr="Part II is the liturgy. The Emerald Tablet is the constitution ('as above, so below' is the sentence everyone knows; Hall wants the rest too). The dew of the sages is a moisture that is also a mercy. The mountain of the moon is a place-name for a stage. A Rosicrucian letter sits here because the Order and the flask are using the same metaphors. Together with Part I this is HALL's laboratory manual without the danger of being one.",
    ),
    "hermetic-figures": dict(
        see_also=["diagrams", "alchemy-1", "chemical-marriage", "rose-cross"],
        correspondences=["naples", "1606", "figure", "claudius"],
        rite=("In what year does Hall date the Naples manuscript of these figures?", ["1606"]),
        thesis="A 1606 Naples manuscript: alchemy as a picture-book you walk page by page.",
        points=["Claudius de Dominico Celentano", "Illuminated at Naples, 1606", "Figures as a sequence", "Read with the Chemical Marriage", "Pictures before recipes"],
        tr="Hall includes a whole manuscript's figures because he thinks the work is a sequence of images. Naples, 1606: not Egypt, not 1928. A late-Renaissance picture curriculum. You do not need to decode every emblem on first pass. You need to accept that this folio will not stay in prose. Pair it with the fifteen diagrams and Knapp. The Chemical Marriage is the narrative version of the same walk.",
    ),
    "chemical-marriage": dict(
        see_also=["rose-cross", "alchemy-2", "hermetic-figures", "bacon"],
        correspondences=["wedding", "rosenkreuz", "golden stone", "inquisition"],
        rite=("Who is invited to the Chemical Wedding in Hall's retelling?", ["christian rosenkreuz", "christian rosencreutz", "c.r.c.", "rosenkreuz"]),
        thesis="A wedding that is a laboratory: Rosenkreuz invited, tried, and knighted in a stone.",
        points=["Invitation to the Chemical Wedding", "Virgo Lucifera", "Philosophical Inquisition", "Tower of Olympus", "Knights of the Golden Stone"],
        tr="The Chemical Marriage is the one-sitting door HALL has not yet built. Christian Rosenkreuz is invited to a wedding that is also an ordeal: tests, a tower, homunculi, a knighthood of the Golden Stone. Hall reads it as the alchemical work told as a court masque. Virgo Lucifera is not a newspaper bride. The philosophical inquisition is a sorting of souls. When we cut that door, this chapter is the script.",
    ),
    "bacon": dict(
        see_also=["cryptogram", "rose-cross", "freemasonic", "emissaries"],
        correspondences=["bacon", "shakespeare", "thirty-three", "acrostic"],
        rite=("What number does Hall call significant in the Bacon-Shakespeare file?", ["thirty-three", "33", "thirty three"]),
        thesis="Bacon, Shakespeare, and a mask: acrostics, thirty-three, a philosophic death.",
        points=["Rosicrucian mask", "Life of Shakspere as Hall spells it", "Sir Francis Bacon", "Acrostic signatures", "Thirty-three; philosophic death"],
        tr="Hall is in the Baconian camp, or at least in its toolbox. The plays are a mask. Acrostics and a cult of thirty-three (see Ceefax 033) are how a doctrine hides in a theatre. Philosophic death is initiation language, not a coroner's report. Whether you buy the authorship claim is less important for HALL than the method: the cryptogram chapter is the theory; this is a famous exhibit. The lost word again, in English.",
    ),
    "freemasonic": dict(
        see_also=["hiramic", "tabernacle", "mysteries-1", "cryptogram"],
        correspondences=["enoch", "collegia", "solomon", "pillars"],
        rite=("Who personifies Universal Wisdom in Hall's Masonic reading?", ["solomon"]),
        thesis="Masonry's symbols are older than the lodge: pillars, Enoch, Collegia, Solomon as Wisdom.",
        points=["Pillars of the sons of Seth", "Enoch and the Royal Arch", "Dionysiac Architects", "Roman Collegia", "Solomon as Universal Wisdom"],
        tr="After Hiram, this is the institutional chapter. Hall wants a lineage: Seth's pillars, Enoch's buried knowledge, the Dionysiac architects, the Roman Collegia, then the lodge. Solomon is not only a king; he is Wisdom's name in a building. 'Freemasonry's priceless heritage' is Hall at his most partisan. For HALL it is also why the Hiramic door and the tabernacle chapter belong in the same echo.",
    ),
    "mystic-christianity": dict(
        see_also=["sun", "cross", "apocalypse", "tabernacle"],
        correspondences=["essenes", "christ", "merlin", "arthur"],
        rite=("Which Jewish sect does Hall connect with the early Christian mystery?", ["essenes", "the essenes"]),
        thesis="Christ as a title you can wear; Essenes, Arthur, Merlin as the same current in other clothes.",
        points=["Irenaeus on the life of Christ", "Original name of Jesus", "The christened man", "Essenes", "Arthurian cycle; Merlin"],
        tr="Hall's Jesus is a mystery-graduate. 'Christ' is a chrism, an office. The Essenes are a Jewish closed room next door to the story. Merlin and Arthur are the same current in Britain: a mage and a king, a table, a grail already filed under stones. He is not writing a parish history. He is keeping Christianity inside the comparative table that started with Mithras and the sun.",
    ),
    "cross": dict(
        see_also=["sun", "mystic-christianity", "american-indian", "tabernacle"],
        correspondences=["cross", "crucifixion", "quetzalcoatl", "calvary"],
        rite=("Which Mexican dying god does Hall name beside the crucifixion?", ["quetzalcoatl"]),
        thesis="The cross is older than Calvary; the crucifixion is a cosmic allegory hung on a man.",
        points=["Aurea Legenda", "Lost libraries of Alexandria", "Cross in pagan symbolism", "Crucifixion as cosmic allegory", "Quetzalcoatl; nails of the Passion"],
        tr="Hall will not let the cross be only an execution device. It is a fourfold world, a tree, a man with arms out. Quetzalcoatl is the Mesoamerican cousin: a dying god on a similar geometry. The nails and the Passion are filed as solar and directional emblems as well as wounds. Alexandria's lost libraries are here as a wound in the record. The chapter is dangerous if you want a unique scandal; it is useful if you want a grammar.",
    ),
    "apocalypse": dict(
        see_also=["mystic-christianity", "qabbalah", "tarot", "cryptogram"],
        correspondences=["apocalypse", "lamb", "beast", "ephesus"],
        rite=("What city does Hall name as sacred to the Apocalypse's setting?", ["ephesus"]),
        thesis="Revelation is a mystery-text: city, lamb, horsemen, a number that is also a name.",
        points=["Ephesus", "Authorship", "Alpha and Omega", "Lamb; four horsemen", "Number of the beast"],
        tr="Hall reads the Apocalypse as an initiated document, not a newspaper about the end. Alpha and Omega are the same as the beginning-and-end of every other mystery alphabet. The Lamb is a solar/sacrificial type. The horsemen are fourfold, like elements. The number of the beast is gematria's most famous public scare. Ephesus is a mystery-city. Pair this with the Qabbalah and cryptogram chapters: counting, imaging, concealing.",
    ),
    "islam": dict(
        see_also=["qabbalah", "mystic-christianity", "emissaries", "rose-cross"],
        correspondences=["kaaba", "prophet", "mecca", "koran"],
        rite=("What cubical shrine at Mecca does Hall treat as a mystery-object?", ["kaaba", "caaba", "the kaaba"]),
        thesis="Islam has a secret doctrine too: a cube, a pilgrimage, a prophet who closes a gate.",
        points=["Life of Mohammed", "Revelation of the Koran", "Valedictory pilgrimage", "Tomb of the Prophet", "Kaaba; secret doctrine of Islam"],
        tr="Hall will not leave Islam as the folio's outsider. The Kaaba is a cube — fourfold, a house of a stone. Pilgrimage is a rite of circling. The Prophet's life is told with respect and with Hall's usual hunger for an inner teaching beside the public law. Whether his 'secret doctrine of Islam' would satisfy a historian of Sufism is one question. That he insists the comparative table has a column for Mecca is the chapter's job.",
    ),
    "american-indian": dict(
        see_also=["fishes-2", "cross", "emissaries", "mysteries-3"],
        correspondences=["peace pipe", "popol vuh", "xibalba", "midewiwin"],
        rite=("What Maya-K'iche' book does Hall cite?", ["popol vuh", "the popol vuh"]),
        thesis="The Americas kept mysteries: pipe, Popol Vuh, Xibalba, the Midewiwin.",
        points=["Ceremony of the peace pipe", "Historical Hiawatha", "Popol Vuh", "American Indian sorcery", "Xibalba; Midewiwin"],
        tr="Hall's table reaches this continent. The peace pipe is a shared breath as a rite. Hiawatha is historicized against the poem. The Popol Vuh and Xibalba are a descent-and-return as serious as Eleusis. The Midewiwin is a medicine society — a lodge. He can be dated and clumsy on ethnography; the structural claim is the one HALL uses: mystery is not a European patent. Pair with Quetzalcoatl in the cross chapter and the Great Seal in the bestiary.",
    ),
    "emissaries": dict(
        see_also=["bacon", "rose-cross", "fishes-2", "conclusion"],
        correspondences=["hypatia", "cagliostro", "saint-germain", "flag"],
        rite=("Which murdered Alexandrian philosopher does Hall name among the emissaries?", ["hypatia"]),
        thesis="The mysteries keep sending people: Hypatia, Cagliostro, Saint-Germain, and a flag.",
        points=["Golden Chain of Homer", "Hypatia", "Cagliostro", "Comte de Saint-Germain", "American flag and the Declaration"],
        tr="Hall's last biographical cabinet. Hypatia is the murdered library. Cagliostro and Saint-Germain are the eighteenth-century rumors that will not log off (HALL's WHO still has them idle). The American founding is filed as an emissary event: flag, Declaration, the Seal already discussed. The Golden Chain is the lineage metaphor. This chapter is why the BBS has seers instead of empty chairs.",
    ),
    "conclusion": dict(
        see_also=["preface", "introduction", "emissaries", "about-author"],
        correspondences=["wisdom", "mountain", "initiate", "unknown"],
        rite=("From where does Hall's seeker finally look down on the cities of the plains?", ["summit", "wisdom's mount", "the summit of wisdom's mount", "mountain"]),
        thesis="After the last emblem: breadth of vision, the haze of the Unknown, the mysteries still at the threshold.",
        points=["Path pointed out by the wise", "Summit of wisdom's mount", "Cities of the plains as specks", "Initiates call disciples from physical pursuits", "Mysteries at the threshold of reality"],
        tr="The conclusion is a view, not a recap. The seeker climbs, looks down, sees how small the civic noise is and how the horizon stays haze. Wisdom is breadth. The mysteries still stand at a threshold Hall will not pretend to have crossed in prose. It sends you back to the preface: he did not claim to finish the work, only to house it. HALL's three depths are that honesty: a screen, a walkthrough, then his own sentences.",
    ),
    "about-author": dict(
        see_also=["preface", "conclusion", "emissaries"],
        correspondences=["hall", "1928", "los angeles"],
        rite=("In what year was The Secret Teachings of All Ages published?", ["1928"]),
        thesis="Manly Palmer Hall, 1901–1990: a Canadian-born mystic who published the folio at twenty-seven.",
        points=["Born 18 March 1901", "Secret Teachings published 1928", "Los Angeles as his working city", "Masonic and other affiliations later", "Died 29 August 1990"],
        tr="The 2009 transcription adds a short life. Hall was twenty-seven when the encyclopedia came out in 1928, after the two years of sitting described in the preface. Los Angeles was the workshop. Later honors and groups accreted; they are not required to use the book. He died in 1990. HALL's sysop is this man, not a modern agency, and the node date stays 1928.",
    ),
}


def nfo(cid: str, rec: dict) -> str:
    meta = BY_ID[cid]
    tag = cid.upper().replace("-", "")[:8]
    pts = "\n".join(f"  * {p}" for p in rec["points"])
    also = "  ".join(rec["see_also"])
    return (
        f"{tag}.NFO                                          HALL 1.3\n"
        "================================================================\n"
        f"{meta['title']}\n"
        f"Manly P. Hall · 1928 · folio p.{meta['page']} · ECHO {meta['echo']}\n\n"
        f"THESIS\n  {rec['thesis']}\n\n"
        f"POINTS\n{pts}\n\n"
        f"SEE ALSO  {also}\n"
        "DEGREE    NEOPHYTE may read this screen\n"
        "================================================================\n"
    )


def main() -> None:
    out = ROOT / "data" / "chapters"
    out.mkdir(parents=True, exist_ok=True)
    n = 0
    for cid, rec in COPY.items():
        payload = {
            "id": cid,
            "see_also": rec["see_also"],
            "correspondences": rec["correspondences"],
            "rite": {"prompt": rec["rite"][0], "accept": rec["rite"][1]},
            "signal": nfo(cid, rec),
            "translation": rec["tr"],
        }
        (out / f"{cid}.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        n += 1
    for ch in CAT["chapters"]:
        folio = ROOT / "data" / "folio" / f"{ch['id']}.txt"
        chap = ROOT / "data" / "chapters" / f"{ch['id']}.json"
        ch["ready"] = folio.exists() and folio.stat().st_size > 200 and chap.exists()
    (ROOT / "data" / "catalog.json").write_text(json.dumps(CAT, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ready = sum(1 for c in CAT["chapters"] if c["ready"])
    print(f"wrote {n} json; catalog ready {ready}/{len(CAT['chapters'])}")


if __name__ == "__main__":
    main()
