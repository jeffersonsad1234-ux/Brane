export class ResponseComposer {
  compose(intentId, results, context) {
    try {
      if (!results || results.length === 0) {
        return "";
      }
      const composer = this._getComposer(intentId);
      if (!composer) return "";
      return composer(results, context) || "";
    } catch {
      return "";
    }
  }

  composeStream(intentId, results, context) {
    return this.compose(intentId, results, context);
  }

  _getComposer(intentId) {
    const composers = {
      news: this._composeNews,
      search: this._composeSearch,
      browser: this._composeSearch,
      prompt: this._composePrompt,
      script: this._composeScript,
      copywriting: this._composeCopy,
      marketing: this._composeMarketing,
      seo: this._composeSEO,
      video: this._composeVideo,
      automation: this._composeAutomation,
      code: this._composeCode,
      affiliate: this._composeAffiliate,
      branding: this._composeMarketing,
      ecommerce: this._composeAffiliate,
    };
    return composers[intentId] || this._composeGeneral;
  }

  _safeResults(results) {
    if (!results || !Array.isArray(results)) return [];
    return results;
  }

  _safeData(result) {
    if (!result || !result.data) return null;
    return result.data;
  }

  _composeNews(results, ctx) {
    try {
      const safe = this._safeResults(results);
      const searchResult = safe.find((r) => r.tool === "NewsSearchTool" || r.tool === "BrowserSearchTool");
      if (!searchResult || !searchResult.data || !searchResult.data.results || !searchResult.data.results.length) {
        return "";
      }
      const items = searchResult.data.results.slice(0, 8);
      let md = `## Informações encontradas na web\n\n`;
      for (const item of items) {
        md += `### ${item.title || "Sem título"}\n`;
        if (item.snippet) md += `${item.snippet}\n\n`;
        if (item.url) md += `🔗 [Ler mais](${item.url})\n\n`;
      }
      md += `---\n*Resultados de pesquisa web — verifique as fontes para detalhes completos.*`;
      return md;
    } catch {
      return "";
    }
  }

  _composeSearch(results, ctx) {
    return this._composeNews(results, ctx);
  }

  _composePrompt(results, ctx) {
    try {
      const tool = (this._safeResults(results)).find((r) => r.tool === "PromptGeneratorTool");
      const d = this._safeData(tool);
      if (!d) return "";
      let md = `## Prompt Profissional\n\n`;
      md += `**Objetivo:** ${d.objective || (ctx ? ctx.userMessage : "") || ""}\n\n`;
      if (d.context) md += `**Contexto:** ${d.context}\n\n`;
      if (d.instructions) md += `**Instruções:**\n${d.instructions}\n\n`;
      if (d.referencePrompt) md += `### Prompt Final\n\n\`\`\`\n${d.referencePrompt}\n\`\`\`\n\n`;
      if (d.variations && Array.isArray(d.variations) && d.variations.length) {
        md += `### Variações\n\n`;
        d.variations.forEach((v, i) => { md += `${i + 1}. ${v}\n`; });
        md += "\n";
      }
      if (d.tips && Array.isArray(d.tips) && d.tips.length) {
        md += `### Dicas\n\n`;
        d.tips.forEach((t) => { md += `- ${t}\n`; });
      }
      return md;
    } catch { return ""; }
  }

  _composeScript(results, ctx) {
    try {
      const tool = (this._safeResults(results)).find((r) => r.tool === "ScriptGeneratorTool");
      const d = this._safeData(tool);
      if (!d) return "";
      let md = `## Roteiro Profissional\n\n`;
      if (d.platform) md += `**Plataforma:** ${d.platform}\n`;
      if (d.duration) md += `**Duração:** ${d.duration}\n\n`;
      if (d.hook) md += `### Hook (0-3s)\n${d.hook}\n\n`;
      if (d.problem) md += `### Problema\n${d.problem}\n\n`;
      if (d.solution) md += `### Solução\n${d.solution}\n\n`;
      if (d.cta) md += `### CTA\n${d.cta}\n\n`;
      if (d.fullScript) md += `### Roteiro Completo\n\n${d.fullScript}\n\n`;
      if (d.tips && Array.isArray(d.tips) && d.tips.length) {
        md += `### Dicas de Produção\n`;
        d.tips.forEach((t) => { md += `- ${t}\n`; });
      }
      return md;
    } catch { return ""; }
  }

  _composeCopy(results, ctx) {
    try {
      const tool = (this._safeResults(results)).find((r) => r.tool === "CopywritingTool");
      const d = this._safeData(tool);
      if (!d) return "";
      let md = `## Copy Persuasiva\n\n`;
      if (d.problem) md += `**Problema:** ${d.problem}\n\n`;
      if (d.agitation) md += `**Agitação:** ${d.agitation}\n\n`;
      if (d.headlines && Array.isArray(d.headlines) && d.headlines.length) {
        md += `### Headlines\n`;
        d.headlines.forEach((h, i) => { md += `${i + 1}. ${h}\n`; });
        md += "\n";
      }
      if (d.body) md += `### Corpo do Texto\n${d.body}\n\n`;
      if (d.ctas && Array.isArray(d.ctas) && d.ctas.length) {
        md += `### Call to Action\n`;
        d.ctas.forEach((c, i) => { md += `${i + 1}. ${c}\n`; });
        md += "\n";
      }
      if (d.fullCopy) md += `### Copy Completa\n\n${d.fullCopy}\n\n`;
      if (d.tips && Array.isArray(d.tips) && d.tips.length) {
        md += `### Gatilhos Utilizados\n`;
        d.tips.forEach((t) => { md += `- ${t}\n`; });
      }
      return md;
    } catch { return ""; }
  }

  _composeMarketing(results, ctx) {
    try {
      const tool = (this._safeResults(results)).find((r) => r.tool === "MarketingStrategyTool");
      const d = this._safeData(tool);
      if (!d) return "";
      let md = `## Estratégia de Marketing\n\n`;
      if (d.overview) md += `${d.overview}\n\n`;
      if (d.strategies && Array.isArray(d.strategies) && d.strategies.length) {
        md += `### Estratégias\n\n`;
        d.strategies.forEach((s, i) => {
          md += `${i + 1}. **${s.title || ""}**\n${s.description || ""}\n\n`;
        });
      }
      if (d.channels && Array.isArray(d.channels) && d.channels.length) {
        md += `### Canais Recomendados\n`;
        d.channels.forEach((c) => { md += `- ${c}\n`; });
        md += "\n";
      }
      if (d.metrics && Array.isArray(d.metrics) && d.metrics.length) {
        md += `### Métricas\n`;
        d.metrics.forEach((m) => { md += `- ${m}\n`; });
        md += "\n";
      }
      if (d.nextSteps && Array.isArray(d.nextSteps) && d.nextSteps.length) {
        md += `### Próximos Passos\n`;
        d.nextSteps.forEach((s, i) => { md += `${i + 1}. ${s}\n`; });
      }
      return md;
    } catch { return ""; }
  }

  _composeSEO(results, ctx) {
    try {
      const tool = (this._safeResults(results)).find((r) => r.tool === "SEOGeneratorTool");
      const d = this._safeData(tool);
      if (!d) return "";
      let md = `## Estratégia de SEO\n\n`;
      if (d.overview) md += `${d.overview}\n\n`;
      if (d.keywords && Array.isArray(d.keywords) && d.keywords.length) {
        md += `### Palavras-Chave\n`;
        d.keywords.forEach((k) => { md += `- **${k.word || ""}** ${k.volume || ""} ${k.difficulty ? `(dif: ${k.difficulty})` : ""}\n`; });
        md += "\n";
      }
      if (d.onPage && Array.isArray(d.onPage) && d.onPage.length) {
        md += `### On-Page\n`;
        d.onPage.forEach((o) => { md += `- ${o}\n`; });
        md += "\n";
      }
      if (d.content && Array.isArray(d.content) && d.content.length) {
        md += `### Ideias de Conteúdo\n`;
        d.content.forEach((c) => { md += `- ${c}\n`; });
        md += "\n";
      }
      if (d.nextSteps) md += `### Próximos Passos\n${d.nextSteps}\n`;
      return md;
    } catch { return ""; }
  }

  _composeVideo(results, ctx) {
    try {
      const tool = (this._safeResults(results)).find((r) => r.tool === "VideoIdeaTool");
      const d = this._safeData(tool);
      if (!d) return "";
      let md = `## Conteúdo em Vídeo\n\n`;
      if (d.strategy) md += `${d.strategy}\n\n`;
      if (d.ideas && Array.isArray(d.ideas) && d.ideas.length) {
        md += `### Ideias de Vídeo\n\n`;
        d.ideas.forEach((idea, i) => {
          md += `${i + 1}. **${idea.title || ""}**\n`;
          if (idea.format) md += `   Formato: ${idea.format}\n`;
          if (idea.description) md += `   ${idea.description}\n`;
          md += "\n";
        });
      }
      if (d.tips && Array.isArray(d.tips) && d.tips.length) {
        md += `### Dicas de Produção\n`;
        d.tips.forEach((t) => { md += `- ${t}\n`; });
      }
      return md;
    } catch { return ""; }
  }

  _composeAutomation(results, ctx) {
    try {
      const tool = (this._safeResults(results)).find((r) => r.tool === "WorkflowBuilderTool");
      const d = this._safeData(tool);
      if (!d) return "";
      let md = `## Workflow de Automação\n\n`;
      if (d.overview) md += `${d.overview}\n\n`;
      if (d.steps && Array.isArray(d.steps) && d.steps.length) {
        md += `### Passos do Workflow\n`;
        d.steps.forEach((s, i) => { md += `${i + 1}. **${s.action || ""}** — ${s.description || ""}\n`; });
        md += "\n";
      }
      if (d.triggers && Array.isArray(d.triggers) && d.triggers.length) {
        md += `### Gatilhos\n`;
        d.triggers.forEach((t) => { md += `- ${t}\n`; });
        md += "\n";
      }
      if (d.tools) md += `### Ferramentas\n${d.tools}\n\n`;
      if (d.code) md += `### Código\n\`\`\`\n${d.code}\n\`\`\`\n`;
      return md;
    } catch { return ""; }
  }

  _composeCode(results, ctx) {
    try {
      const tool = (this._safeResults(results)).find((r) => r.tool === "CodeGeneratorTool");
      const d = this._safeData(tool);
      if (!d) return "";
      let md = `## Solução em Código\n\n`;
      if (d.explanation) md += `**Explicação:** ${d.explanation}\n\n`;
      if (d.language) md += `**Linguagem:** ${d.language}\n\n`;
      if (d.code) md += `\`\`\`${d.language || ""}\n${d.code}\n\`\`\`\n\n`;
      if (d.usage) md += `### Como Usar\n${d.usage}\n\n`;
      if (d.notes) md += `### Observações\n${d.notes}\n`;
      return md;
    } catch { return ""; }
  }

  _composeAffiliate(results, ctx) {
    try {
      const tool = (this._safeResults(results)).find((r) => r.tool === "AffiliateContentTool");
      const d = this._safeData(tool);
      if (!d) return "";
      let md = `## Conteúdo para Afiliados\n\n`;
      if (d.overview) md += `${d.overview}\n\n`;
      if (d.content && Array.isArray(d.content) && d.content.length) {
        md += `### Conteúdo\n\n`;
        d.content.forEach((c, i) => { md += `${i + 1}. ${c}\n`; });
        md += "\n";
      }
      if (d.strategies && Array.isArray(d.strategies) && d.strategies.length) {
        md += `### Estratégias de Conversão\n`;
        d.strategies.forEach((s) => { md += `- ${s}\n`; });
        md += "\n";
      }
      if (d.ctas && Array.isArray(d.ctas) && d.ctas.length) {
        md += `### Calls to Action\n`;
        d.ctas.forEach((c) => { md += `- ${c}\n`; });
      }
      return md;
    } catch { return ""; }
  }

  _composeGeneral(results, ctx) {
    try {
      const items = (this._safeResults(results)).filter((r) => r.success && r.data);
      if (!items.length) return "";
      return items.map((r) => {
        if (typeof r.data === "string") return r.data;
        if (typeof r.formatted === "string") return r.formatted;
        return "";
      }).filter(Boolean).join("\n\n");
    } catch { return ""; }
  }
}

export const responseComposer = new ResponseComposer();
