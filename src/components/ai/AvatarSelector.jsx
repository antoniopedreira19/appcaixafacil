import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import FlavioAvatar, { FLAVIO_AVATARS } from './FlavioAvatar';

export default function AvatarSelector({ open, onClose, onSelectAvatar, currentAvatar }) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || 'avatar1');
  const [isLoading, setIsLoading] = useState(false);

  // Sincroniza o estado local quando o modal abre ou currentAvatar muda
  useEffect(() => {
    if (open && currentAvatar) {
      setSelectedAvatar(currentAvatar);
    }
  }, [open, currentAvatar]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onSelectAvatar(selectedAvatar);
      // Reseta o loading após salvar
      setIsLoading(false);
      // O parent é responsável por fechar o modal
    } catch (error) {
      console.error('Error selecting avatar:', error);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Reseta para o avatar atual ao cancelar
      setSelectedAvatar(currentAvatar || 'avatar1');
      onClose();
    }
  };

  // Separa avatares masculinos e femininos
  const maleAvatars = Object.values(FLAVIO_AVATARS).filter(a => a.gender === 'male');
  const femaleAvatars = Object.values(FLAVIO_AVATARS).filter(a => a.gender === 'female');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isLoading) {
        // Reseta para o avatar atual ao fechar
        setSelectedAvatar(currentAvatar || 'avatar1');
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Escolha seu Consultor(a) Financeiro</DialogTitle>
          <DialogDescription>
            Selecione o Flávio ou Flávia que você prefere para suas conversas sobre finanças
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatares Masculinos */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              👨‍💼 Flávio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {maleAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    if (!isLoading) {
                      setSelectedAvatar(avatar.id);
                    }
                  }}
                  disabled={isLoading}
                  className={`relative p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                    selectedAvatar === avatar.id
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-slate-200 bg-white hover:border-purple-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {selectedAvatar === avatar.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center space-y-3">
                    <FlavioAvatar avatarId={avatar.id} size="xxl" />
                    <div className="text-center">
                      <h4 className="font-bold text-slate-900">{avatar.name}</h4>
                      <p className="text-sm text-slate-600 mt-1">{avatar.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Avatares Femininos */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              👩‍💼 Flávia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {femaleAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    if (!isLoading) {
                      setSelectedAvatar(avatar.id);
                    }
                  }}
                  disabled={isLoading}
                  className={`relative p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                    selectedAvatar === avatar.id
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-slate-200 bg-white hover:border-purple-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {selectedAvatar === avatar.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center space-y-3">
                    <FlavioAvatar avatarId={avatar.id} size="xxl" />
                    <div className="text-center">
                      <h4 className="font-bold text-slate-900">{avatar.name}</h4>
                      <p className="text-sm text-slate-600 mt-1">{avatar.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            type="button"
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              'Confirmar Escolha'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}