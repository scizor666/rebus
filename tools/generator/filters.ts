import type { Lang } from "../../src/rebus/types.ts";

/**
 * Profanity filter. Two tiers, because the puzzle answers come straight from
 * subtitle/word-frequency corpora that DO contain swearing:
 *
 *  - SUBSTR: long, unambiguous roots matched as substrings, so they also catch
 *    inflections. Each entry is vetted to NOT occur inside a clean word
 *    (e.g. we use "блядь" not "бля", which would wrongly hit сабля/рубля;
 *    "мудак" not "муд", which would hit мудрость; "пидор" via substring but
 *    "педик" only as an exact word, since it lurks inside велосипедик).
 *
 *  - EXACT: short or ambiguous swears matched against the whole word only
 *    (English "ass"/"anal"/"cock"/"tit" hide inside class/canal/peacock/title;
 *    Russian bare verb forms like ебать collide with хлебать as substrings).
 *
 * All matching is done on the lowercased, ё→е-normalized word.
 */
const SUBSTR: Record<Lang, string[]> = {
  en: [
    "fuck", "shit", "bitch", "cunt", "pussy", "nigger", "nigga", "faggot",
    "whore", "slut", "wank", "bollock", "bastard", "asshole", "dickhead",
    "motherf", "jackass", "dumbass", "douche", "jizz", "blowjob", "handjob",
    "dildo", "porn", "rapist", "molest", "incest", "penis", "vagina",
    "prostitut", "masturbat", "ejaculat", "clitoris", "scrotum", "pedophil",
    "bestial", "orgasm", "nazi", "hentai", "nympho", "gangbang", "cumshot",
    "fellatio", "sodom", "xxx",
  ],
  ru: [
    "хуй", "хуя", "хую", "хуи", "хуе", "хуё", "похую", "нахуй", "дохуя",
    "охуе", "охуи", "ахуе", "пизд", "пезд", "спизд", "распизд", "ебан",
    "ебись", "ебло", "ебля", "ёбан", "ёбну", "ебуч", "ебырь", "выеб", "заеб",
    "наеб", "объеб", "отъеб", "поеб", "подъеб", "приеб", "проеб", "разъеб",
    "съеб", "уеб", "въеб", "доеб", "взъеб", "долбоеб", "блядь", "бляди",
    "блядк", "залуп", "гондон", "гандон", "мудак", "мудил", "мудоз", "мудач",
    "пидор", "пидар", "шлюх", "мраз", "дроч", "наркоман", "наркот", "ублюд",
    "выблядок", "шалав", "мандавош", "елда", "пердун", "пердеж", "говн", "жоп",
  ],
};

const EXACT: Record<Lang, Set<string>> = {
  en: new Set([
    "ass", "arse", "sex", "sexy", "sexual", "anal", "cock", "cocks", "tit",
    "tits", "dick", "dicks", "damn", "hell", "crap", "piss", "pissed", "cum",
    "rape", "raped", "rapes", "raping", "boob", "boobs", "prick", "twat",
    "spunk", "skank", "wog", "spic", "kike", "chink", "coon", "retard",
  ]),
  ru: new Set([
    "ебать", "ебал", "ебала", "ебали", "ебало", "ебут", "ебет", "еби",
    "блять", "сука", "суки", "суку", "суке", "сукой", "сучка", "сучки",
    "гей", "залупа", "манда", "манды", "говно", "говна", "жопа", "жопу",
    "жопы", "срать", "ссать", "педик",
  ]),
};

export function isClean(word: string, lang: Lang): boolean {
  const w = word.replace(/ё/g, "е");
  if (EXACT[lang].has(w)) return false;
  return !SUBSTR[lang].some((bad) => w.includes(bad.replace(/ё/g, "е")));
}

/**
 * Function words / particles / pronouns that make dull rebuses. Stored ё→е
 * normalized; skipped as puzzle targets (they still appear as letter fragments
 * inside other puzzles, just not as answers).
 */
const STOP: Record<Lang, Set<string>> = {
  en: new Set(
    ("the of and to a in is it you that he was for on are with as his they at be this " +
      "have from or one had by but not what all were we when can there use an each which " +
      "she do how their if will up other about out many then them these so some her would " +
      "make like him into time has look two more write go see no way could my than been who " +
      "its did get may down side now find any new work part take get place made live where " +
      "after back little only round man year came show every good me give our under name very " +
      "through just form much great think say help low line before turn cause same mean differ " +
      "move right boy old too does tell sentence set three want air well also play small end put " +
      "home read hand port large spell add even land here must big high such follow act why ask " +
      "men change went light kind off need house picture try us again animal point mother world").split(
      /\s+/,
    ),
  ),
  ru: new Set(
    ("я ты он она оно мы вы они что это как так вот вам вас нам нас его ее их мне тебе меня тебя " +
      "себя нет да не ни но и а или же бы ли для без над при про под изо обо кто где когда куда " +
      "тогда сейчас очень уже еще был была было были есть быть будет может можно нужно надо все " +
      "весь вся этот эта эти того этого чего кого чем том тех всех всем чтобы потому если чтоб хотя " +
      "только даже тоже также чуть пока ведь вон тут там здесь сюда оттуда отсюда зачем почему " +
      "себе ним ней них нему ему ей им мной тобой собой когда-то кое кому чему чём ничего никто " +
      "ничто свой своя свое мой моя твой твоя наш ваш будто словно либо нибудь раз два сам сама " +
      "очень более менее самый каждый который какой такой этакий весьма").split(/\s+/),
  ),
};

/** A word worth turning into a puzzle: clean and not a dull function word. */
export function isGoodTarget(word: string, lang: Lang): boolean {
  return isClean(word, lang) && !STOP[lang].has(word.replace(/ё/g, "е"));
}
