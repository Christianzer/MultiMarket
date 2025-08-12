<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormLabel, FormItem, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';

const router = useRouter();
const authStore = useAuthStore();
const appStore = useAppStore();

const loading = ref(false);
const error = ref('');

const formSchema = toTypedSchema(z.object({
  username: z.string().min(1, 'Nom d\'utilisateur requis'),
  password: z.string().min(1, 'Mot de passe requis'),
}));

const passwordVisible = ref(false)


const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    username: '',
    password: ''
  }
});

const onSubmit = form.handleSubmit(async (values) => {
  loading.value = true;
  error.value = '';

  try {
    const response = await authStore.login(values);

    // Rediriger vers le bon dashboard selon le rôle
    const userRole = response.user.role;
    if (userRole === 'super_admin') {
      router.push('/dashboard/super-admin');
    } else if (userRole === 'admin') {
      router.push('/dashboard/admin');
    } else if (userRole === 'caissier') {
      router.push('/dashboard/caisse');
    } else {
      router.push('/dashboard');
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur de connexion';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
    <Card class="max-w-[320px] md:max-w-[400px] w-full shadow-lg">
      <CardHeader class="text-center pb-6">
        <CardTitle class="text-2xl font-bold">MultiMarket</CardTitle>
        <p class="text-muted-foreground text-sm">Connectez-vous à votre compte</p>
      </CardHeader>
      
      <CardContent>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <!-- Messages d'erreur -->
          <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive text-sm p-3 rounded-md">
            {{ error }}
          </div>

          <!-- Champ username -->
          <FormField v-slot="{ componentField }" name="username">
            <FormItem>
              <FormLabel>Nom d'utilisateur</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  
                  v-bind="componentField"
                  :disabled="loading"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="password">
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <div style="position: relative;">
                  <Input
                    :type="passwordVisible ? 'text' : 'password'"
                    v-bind="componentField"
                    :disabled="loading"
                  />
                  <button
                    type="button"
                    @click="passwordVisible = !passwordVisible"
                    style="position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background: none; border: none; cursor: pointer;"
                  >
                    {{ passwordVisible ? '🙈' : '👁️' }}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <!-- Bouton de connexion -->
          <Button 
            type="submit" 
            class="w-full" 
            :disabled="loading"
            :style="{ backgroundColor: appStore.primaryColor }"
          >
            <span v-if="loading">Connexion...</span>
            <span v-else>Se connecter</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  </main>
</template>