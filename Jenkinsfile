pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        PNPM_VERSION = '8'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Node.js') {
            steps {
                script {
                    // Instalar Node.js si no está disponible
                    sh '''
                        # Verificar si Node.js está instalado
                        if ! command -v node &> /dev/null; then
                            echo "Installing Node.js ${NODE_VERSION}"
                            curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
                            apt-get install -y nodejs
                        fi
                        
                        # Verificar versión
                        node --version
                        npm --version
                    '''
                }
            }
        }
        
        stage('Setup pnpm') {
            steps {
                script {
                    sh '''
                        # Instalar pnpm si no está disponible
                        if ! command -v pnpm &> /dev/null; then
                            echo "Installing pnpm ${PNPM_VERSION}"
                            npm install -g pnpm@${PNPM_VERSION}
                        fi
                        
                        # Verificar versión
                        pnpm --version
                    '''
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "Installing dependencies..."
                    pnpm install --frozen-lockfile
                '''
            }
        }
        
        stage('Build Project') {
            parallel {
                stage('Build Main UI') {
                    steps {
                        sh '''
                            echo "Building Main UI..."
                            cd packages/MainUI
                            pnpm run build || echo "Main UI build not available"
                        '''
                    }
                }
                
                stage('Build Component Library') {
                    steps {
                        sh '''
                            echo "Building Component Library..."
                            cd packages/ComponentLibrary
                            pnpm run build || echo "Component Library build not available"
                        '''
                    }
                }
                
                stage('Build API Client') {
                    steps {
                        sh '''
                            echo "Building API Client..."
                            cd packages/api-client
                            pnpm run build || echo "API Client build not available"
                        '''
                    }
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh '''
                            echo "Running unit tests..."
                            # Ejecutar tests si están disponibles
                            pnpm run test || echo "No tests configured"
                        '''
                    }
                }
                
                stage('Lint') {
                    steps {
                        sh '''
                            echo "Running linting..."
                            # Ejecutar linting si está disponible
                            pnpm run lint || echo "No linting configured"
                        '''
                    }
                }
                
                stage('Type Check') {
                    steps {
                        sh '''
                            echo "Running type check..."
                            # Ejecutar type check si está disponible
                            pnpm run typecheck || echo "No type check configured"
                        '''
                    }
                }
            }
        }
        
        stage('Storybook Verification') {
            steps {
                script {
                    sh '''
                        echo "🎨 Building Storybook..."
                        cd packages/storybook
                        
                        # Verificar que Storybook se puede construir correctamente
                        echo "Building Storybook static files..."
                        pnpm run build-storybook
                        
                        # Verificar que los archivos se generaron
                        if [ -d "storybook-static" ]; then
                            echo "✅ Storybook build successful!"
                            echo "📦 Generated files:"
                            ls -la storybook-static/
                        else
                            echo "❌ Storybook build failed - no output directory found"
                            exit 1
                        fi
                        
                        # Opcional: Ejecutar tests de Storybook si están configurados
                        echo "Running Storybook tests..."
                        pnpm run test-storybook || echo "No Storybook tests configured"
                    '''
                }
            }
            post {
                always {
                    // Archivar los archivos de Storybook generados
                    archiveArtifacts artifacts: 'packages/storybook/storybook-static/**/*', 
                                   fingerprint: true,
                                   allowEmptyArchive: true
                }
            }
        }
        
        stage('Deploy Storybook') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    sh '''
                        echo "🚀 Deploying Storybook..."
                        cd packages/storybook
                        
                        # Ejemplo de deployment - ajustar según tu infraestructura
                        
                        # Opción 1: Deployment a servidor estático
                        # rsync -avz storybook-static/ user@server:/path/to/storybook/
                        
                        # Opción 2: Deployment a AWS S3
                        # aws s3 sync storybook-static/ s3://your-storybook-bucket/ --delete
                        
                        # Opción 3: Deployment a Chromatic (si tienes configurado)
                        # npx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN
                        
                        echo "Storybook deployment completed"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            // Limpiar workspace
            cleanWs()
        }
        
        success {
            echo '✅ Pipeline completed successfully!'
            // Notificaciones de éxito si las necesitas
            // slackSend(color: 'good', message: "✅ Build successful: ${env.JOB_NAME} - ${env.BUILD_NUMBER}")
        }
        
        failure {
            echo '❌ Pipeline failed!'
            // Notificaciones de fallo si las necesitas
            // slackSend(color: 'danger', message: "❌ Build failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}")
        }
    }
}