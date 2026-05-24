export class ResponseComposer {
  compose(intentId, results, context) {
    if (!results || results.length === 0) {
      return this._fallback(context.userMessage);
    }

    const composer = this._getComposer(intentId);
    return composer(results, context);
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

  _composeNews(results, ctx) {
    const searchResult = results.find((r) => r.tool === "NewsSearchTool" || r.tool === "BrowserSearchTool");
    if (!searchResult || !searchResult.data?.results?.length) {
      return this._fallback(ctx.userMessage);
    }
    const items = searchResult.data.results.slice(0, 8);
    let md = `## 📰 Últimas notícias e resultados\n\n`;
    for (const item of items) {
      md += `### ${item.title}\n`;
      if (item.snippet) md += `${item.snippet}\n\n`;
      if (item.url) md += `🔗 [Ler mais](${item.url})\n\n`;
    }
    if (items.length === 0) md += "Nenhum resultado encontrado para sua busca.\n";
    return md;
  }

  _composeSearch(results, ctx) {
    return this._composeNews(results, ctx);
  }

  _composePrompt(results, ctx) {
    const tool = results.find((r) => r.tool === "PromptGeneratorTool");
    if (!tool || !tool.data) return this._fallback(ctx.userMessage);
    const d = tool.data;
    let md = `## 📝 Prompt Profissional\n\n`;
    md += `**Objetivo:** ${d.objective || ctx.userMessage}\n\n`;
    if (d.context) md += `**Contexto:** ${d.context}\n\n`;
    if (d.instructions) md += `**Instruções:**\n${d.instructions}\n\n`;
    if (d.referencePrompt) md += `### Prompt Final\n\n\`\`\`\n${d.referencePrompt}\n\`\`\`\n\n`;
    if (d.variations?.length) {
      md += `### Variações\n\n`;
      d.variations.forEach((v, i) => { md += `${i + 1}. ${v}\n`; });
      md += "\n";
    }
    if (d.tips?.length) {
      md += `### 💡 Dicas\n\n`;
      d.tips.forEach((t) => { md += `- ${t}\n`; });
    }
    return md;
  }

  _composeScript(results, ctx) {
    const tool = results.find((r) => r.tool === "ScriptGeneratorTool");
    if (!tool || !tool.data) return this._fallback(ctx.userMessage);
    const d = tool.data;
    let md = `## 🎬 Roteiro Profissional\n\n`;
    if (d.platform) md += `**Plataforma:** ${d.platform}\n`;
    if (d.duration) md += `**Duração:** ${d.duration}\n\n`;
    if (d.hook) md += `### 🎯 Hook (0-3s)\n${d.hook}\n\n`;
    if (d.problem) md += `### ⚡ Problema\n${d.problem}\n\n`;
    if (d.solution) md += `### ✅ Solução\n${d.solution}\n\n`;
    if (d.cta) md += `### 🎬 CTA\n${d.cta}\n\n`;
    if (d.fullScript) md += `### 📋 Roteiro Completo\n\n${d.fullScript}\n\n`;
    if (d.tips?.length) {
      md += `### 💡 Dicas de Produção\n`;
      d.tips.forEach((t) => { md += `- ${t}\n`; });
    }
    return md;
  }

  _composeCopy(results, ctx) {
    const tool = results.find((r) => r.tool === "CopywritingTool");
    if (!tool || !tool.data) return this._fallback(ctx.userMessage);
    const d = tool.data;
    let md = `## ✍️ Copy Persuasiva\n\n`;
    if (d.problem) md += `**Problema:** ${d.problem}\n\n`;
    if (d.agitation) md += `**Agitação:** ${d.agitation}\n\n`;
    if (d.headlines?.length) {
      md += `### 📰 Headlines\n`;
      d.headlines.forEach((h, i) => { md += `${i + 1}. ${h}\n`; });
      md += "\n";
    }
    if (d.body) md += `### 📝 Corpo do Texto\n${d.body}\n\n`;
    if (d.ctas?.length) {
      md += `### 🎯 Call to Action\n`;
      d.ctas.forEach((c, i) => { md += `${i + 1}. ${c}\n`; });
      md += "\n";
    }
    if (d.fullCopy) md += `### 📄 Copy Completa\n\n${d.fullCopy}\n\n`;
    if (d.tips?.length) {
      md += `### 💡 Gatilhos Utilizados\n`;
      d.tips.forEach((t) => { md += `- ${t}\n`; });
    }
    return md;
  }

  _composeMarketing(results, ctx) {
    const tool = results.find((r) => r.tool === "MarketingStrategyTool");
    if (!tool || !tool.data) return this._fallback(ctx.userMessage);
    const d = tool.data;
    let md = `## 📊 Estratégia de Marketing\n\n`;
    if (d.overview) md += `${d.overview}\n\n`;
    if (d.strategies?.length) {
      md += `### 🎯 Estratégias\n\n`;
      d.strategies.forEach((s, i) => { md += `${i + 1}. **${s.title}**\n${s.description}\n\n`; });
    }
    if (d.channels?.length) {
      md += `### 📡 Canais Recomendados\n`;
      d.channels.forEach((c) => { md += `- ${c}\n`; });
      md += "\n";
    }
    if (d.metrics?.length) {
      md += `### 📈 Métricas\n`;
      d.metrics.forEach((m) => { md += `- ${m}\n`; });
      md += "\n";
    }
    if (d.nextSteps?.length) {
      md += `### 🚀 Próximos Passos\n`;
      d.nextSteps.forEach((s, i) => { md += `${i + 1}. ${s}\n`; });
    }
    return md;
  }

  _composeSEO(results, ctx) {
    const tool = results.find((r) => r.tool === "SEOGeneratorTool");
    if (!tool || !tool.data) return this._fallback(ctx.userMessage);
    const d = tool.data;
    let md = `## 🔍 Estratégia de SEO\n\n`;
    if (d.overview) md += `${d.overview}\n\n`;
    if (d.keywords?.length) {
      md += `### 🏆 Palavras-Chave\n`;
      d.keywords.forEach((k) => { md += `- **${k.word}** — ${k.volume || ""} ${k.difficulty ? `(dif: ${k.difficulty})` : ""}\n`; });
      md += "\n";
    }
    if (d.onPage?.length) {
      md += `### 📄 On-Page\n`;
      d.onPage.forEach((o) => { md += `- ${o}\n`; });
      md += "\n";
    }
    if (d.content?.length) {
      md += `### 📝 Ideias de Conteúdo\n`;
      d.content.forEach((c) => { md += `- ${c}\n`; });
      md += "\n";
    }
    if (d.nextSteps) md += `### 🚀 Próximos Passos\n${d.nextSteps}\n`;
    return md;
  }

  _composeVideo(results, ctx) {
    const tool = results.find((r) => r.tool === "VideoIdeaTool");
    if (!tool || !tool.data) return this._fallback(ctx.userMessage);
    const d = tool.data;
    let md = `## 🎥 Conteúdo em Vídeo\n\n`;
    if (d.strategy) md += `${d.strategy}\n\n`;
    if (d.ideas?.length) {
      md += `### 💡 Ideias de Vídeo\n\n`;
      d.ideas.forEach((idea, i) => {
        md += `${i + 1}. **${idea.title}**\n`;
        if (idea.format) md += `   Formato: ${idea.format}\n`;
        if (idea.description) md += `   ${idea.description}\n`;
        md += "\n";
      });
    }
    if (d.tips?.length) {
      md += `### ⚡ Dicas de Produção\n`;
      d.tips.forEach((t) => { md += `- ${t}\n`; });
    }
    return md;
  }

  _composeAutomation(results, ctx) {
    const tool = results.find((r) => r.tool === "WorkflowBuilderTool");
    if (!tool || !tool.data) return this._fallback(ctx.userMessage);
    const d = tool.data;
    let md = `## ⚡ Workflow de Automação\n\n`;
    if (d.overview) md += `${d.overview}\n\n`;
    if (d.steps?.length) {
      md += `### 📋 Passos do Workflow\n`;
      d.steps.forEach((s, i) => { md += `${i + 1}. **${s.action}** — ${s.description}\n`; });
      md += "\n";
    }
    if (d.triggers?.length) {
      md += `### 🔄 Gatilhos\n`;
      d.triggers.forEach((t) => { md += `- ${t}\n`; });
      md += "\n";
    }
    if (d.tools) md += `### 🛠 Ferramentas\n${d.tools}\n\n`;
    if (d.code) md += `### 💻 Código\n\`\`\`\n${d.code}\n\`\`\`\n`;
    return md;
  }

  _composeCode(results, ctx) {
    const tool = results.find((r) => r.tool === "CodeGeneratorTool");
    if (!tool || !tool.data) return this._fallback(ctx.userMessage);
    const d = tool.data;
    let md = `## 💻 Solução em Código\n\n`;
    if (d.explanation) md += `**Explicação:** ${d.explanation}\n\n`;
    if (d.language) md += `**Linguagem:** ${d.language}\n\n`;
    if (d.code) md += `\`\`\`${d.language || ""}\n${d.code}\n\`\`\`\n\n`;
    if (d.usage) md += `### 📖 Como Usar\n${d.usage}\n\n`;
    if (d.notes) md += `### 📝 Observações\n${d.notes}\n`;
    return md;
  }

  _composeAffiliate(results, ctx) {
    const tool = results.find((r) => r.tool === "AffiliateContentTool");
    if (!tool || !tool.data) return this._fallback(ctx.userMessage);
    const d = tool.data;
    let md = `## 🛒 Conteúdo para Afiliados\n\n`;
    if (d.overview) md += `${d.overview}\n\n`;
    if (d.content?.length) {
      md += `### 📝 Conteúdo\n\n`;
      d.content.forEach((c, i) => { md += `${i + 1}. ${c}\n`; });
      md += "\n";
    }
    if (d.strategies?.length) {
      md += `### 🎯 Estratégias de Conversão\n`;
      d.strategies.forEach((s) => { md += `- ${s}\n`; });
      md += "\n";
    }
    if (d.ctas?.length) {
      md += `### ✅ Calls to Action\n`;
      d.ctas.forEach((c) => { md += `- ${c}\n`; });
    }
    return md;
  }

  _composeGeneral(results, ctx) {
    const content = results.filter((r) => r.success && r.data).map((r) => r.formatted || r.data).filter(Boolean).join("\n\n");
    return content || this._fallback(ctx.userMessage);
  }

  _fallback(message) {
    // Absolute last resort — ask the provider directly with an execution prompt
    return "";
  }
}

export const responseComposer = new ResponseComposer();
