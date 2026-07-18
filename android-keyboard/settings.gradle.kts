rootProject.name = "MetaModelKeyboard"

pluginManagement {
    repositories {
        google {
            content { includeGroupByRegex("com\\.android.*") }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google {
            content { includeGroupByRegex("com\\.android.*") }
        }
        mavenCentral()
    }
}

include(":app")
