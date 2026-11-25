      const date = row.date.value.slice(0, 10);
      if (!KEYWORDS.test(title)) continue;

      const id = 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + celex;
      if (results.some(r => r.id === id)) continue;

      results.push({ id, title, date });
      kept++;
      console.log('[EUR-Lex] 🆕', celex, '—', title.slice(0, 70));
    }
    console.log('[EUR-Lex] Nouveautés pertinentes retenues :', kept);

  } catch (e) {
    console.error('[EUR-Lex] ❌ ERREUR SPARQL :', e.message, '— seul le socle est utilisé');
  }

  console.log('[EUR-Lex] Total :', results.length, 'textes');
  return results;
}