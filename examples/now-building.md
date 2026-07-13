# Exemplo do Now Building

O card seleciona automaticamente o repositório elegível com atividade mais recente:

```md
![Projeto em desenvolvimento](http://localhost:8888/api/cards/now-building.svg?username=SEU-USUARIO)
```

Para destacar um repositório específico:

```md
![Projeto em destaque](http://localhost:8888/api/cards/now-building.svg?username=SEU-USUARIO&repository=projectscope.dynamic-svg)
```

Versão compacta:

```md
![Projeto em desenvolvimento](http://localhost:8888/api/cards/now-building.svg?username=SEU-USUARIO&compact=true)
```

Tema claro e largura personalizada:

```md
![Projeto em desenvolvimento](http://localhost:8888/api/cards/now-building.svg?username=SEU-USUARIO&theme=github-light&width=720)
```

Em HTML:

```html
<img
  src="http://localhost:8888/api/cards/now-building.svg?username=SEU-USUARIO"
  alt="Projeto em desenvolvimento"
  width="600"
/>
```
