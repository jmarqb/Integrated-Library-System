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

* Una vez iniciada tu instancia de mysql se procede a realizar la migracion a la bd desde la carpeta migrations de Prisma.
Debes asegurarte que el usuario que estableciste en el .env tenga permisos para realizar operaciones sobre la base de datos. Puedes intentar ejecutar la migracion.
* En caso de error puedes acceder a la terminal del contenedor mysql creado o a tu instancia sql como root y otorgar los permisos  a tu usuario especificado.

Ejemplo para el caso del contenedor mysql:
```
CREATE USER 'test_user'@'%' IDENTIFIED BY 'test_password';
GRANT ALL PRIVILEGES ON *.* TO 'test_user'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

`nota:` la linea CREATE USER 'test_user'@'%' IDENTIFIED BY 'test_password'; podria arrojar el error `ERROR 1396 (HY000): Operation CREATE USER failed for 'test_user'@'% indica que el usuario test_user ya existe con el host %. Dado que ya existe, el comando CREATE USER falla, pero sigue adelante y otorga privilegios con el comando GRANT, lo que es correcto. Por lo que ya seria posible ejecutar la migracion correctamente como se describe en el siguiente paso`

* Ejecutar Migracion:

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





