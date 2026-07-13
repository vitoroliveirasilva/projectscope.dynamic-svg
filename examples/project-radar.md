# Exemplo do Project Radar

Radar padrão com até seis projetos:

```md
![Radar de projetos](http://localhost:8888/api/cards/project-radar.svg?username=SEU-USUARIO)
```

Radar com doze projetos:

```md
![Radar de projetos](http://localhost:8888/api/cards/project-radar.svg?username=SEU-USUARIO&limit=12)
```

Sem rótulos e incluindo forks:

```md
![Radar de projetos](http://localhost:8888/api/cards/project-radar.svg?username=SEU-USUARIO&labels=false&include_forks=true)
```

Com centro e cores personalizados:

```md
![Radar de projetos](http://localhost:8888/api/cards/project-radar.svg?username=SEU-USUARIO&center_label=VITOR&background=0D1117&foreground=FFFFFF&accent=3776AB&border=30363D)
```

Em HTML:

```html
<img
  src="http://localhost:8888/api/cards/project-radar.svg?username=SEU-USUARIO&limit=8"
  alt="Radar de projetos"
  width="640"
/>
```

Durante o desenvolvimento local, substitua `http://localhost:8888` por `http://localhost:8888`.
