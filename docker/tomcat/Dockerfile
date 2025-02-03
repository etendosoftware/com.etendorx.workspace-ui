FROM tomcat:9.0
WORKDIR /usr/local/tomcat/webapps/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENV CATALINA_BASE=/usr/local/tomcat
ENV BBDD_URL="jdbc:postgresql://etendo_db\:5432"
ENV BBDD_SID="etendo"
ENV BBDD_SYSTEM_USER="postgres"
ENV BBDD_SYSTEM_PASSWORD="syspass"
RUN groupadd -r tomcat && useradd -r -g tomcat tomcat
USER tomcat
COPY --chown=tomcat:tomcat etendo ./etendo
ENTRYPOINT ["/entrypoint.sh"]
EXPOSE 8080
CMD ["catalina.sh", "run"]
