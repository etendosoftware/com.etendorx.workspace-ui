FROM tomcat:9.0
WORKDIR /usr/local/tomcat/webapps/
ENV CATALINA_BASE=/usr/local/tomcat
RUN apt-get update && apt-get install -y curl \
    && curl -sSL https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz | tar -xz -C /usr/local/bin
COPY etendo.war ./
EXPOSE 8080
RUN groupadd -r tomcat && useradd -r -g tomcat tomcat
RUN chown -R tomcat:tomcat /usr/local/tomcat
USER tomcat
# CMD /usr/local/bin/dockerize -wait tcp://db:5432 -timeout 900s catalina.sh run
CMD catalina.sh run

