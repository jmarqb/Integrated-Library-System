<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

###Dos vias: local o con stack docker-compose###

 local:

## Installation

```bash
$ git clone https://github.com/jmarqb/Integrated-Library-System.git
$ cd Integrated-Library-System
$ npm install
```

## Configuration

* Configurar las variables de entorno, renombra example-env a .env establece tus propios valores o usa los de prueba
* siempre que cambies credenciales en el .env hay que ejecutar despues:

```
npx prisma generate
```

* Inicia Tu bd mysql -- si no tienes un servidor local mysql en tu maquina puedes usar el `docker-compose-development-locally.yml` que se encuentra en la raiz del proyecto, para ejecutarlo:

```
docker-compose -f docker-compose-development-locally.yml up -d
```

* Una vez iniciada tu instancia de mysql se procede a realizar la migracion a la bd desde la carpeta migrations de Prisma. Ejecuta:

```
 npx prisma migrate dev --name 20231012112830_init 
 ```
 [npx prisma migrate dev --name [carpeta_contiene_migration.sql]] 

* Despues de realizada la migracion generar nuevamente los clientes:

```
npx prisma generate
```

## Running the Application

```bash
$ npm run build
$ npm run start
```


la aplicacion inicia en http://localhost:<puerto>

Por ejemplo: `localhost:<port>/api/doc`


## Stack-Docker

```bash
$ git clone https://github.com/jmarqb/Integrated-Library-System.git
$ cd Integrated-Library-System
$ npm install
```

* Configurar las variables de entorno, renombra example-env a .env establece tus propios valores o usa los de prueba
* siempre que cambies credenciales en el .env hay que ejecutar despues:

```
npx prisma generate
```

* Verificar que el script wait-for-it.sh tenga permisos de ejecucion:
```
chmod +x wait-for-it.sh
```

* Ejecuta:

```
docker-compose up --build
```

la aplicacion inicia en http://localhost:<puerto>

Por ejemplo: `localhost:<port>/api/doc`





